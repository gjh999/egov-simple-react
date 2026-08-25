# syntax=docker/dockerfile:1.7
# egov-simple-react 컨테이너 이미지.
#   1단계: Vite 로 정적 번들을 만든다.
#   2단계: nginx 가 그 번들을 서비스하고 /api 를 백엔드로 넘긴다.

# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /workspace

# 잠금 파일로 재현 가능한 설치
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src

# API 기준 경로는 상대경로(/api)라 빌드 시 백엔드 호스트를 넣지 않는다.
# 실제 백엔드 위치는 실행 시 nginx 의 BACKEND_URL 로 정해진다.
RUN npm run build

# ---------- Runtime ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine

# nginx 가 /api 요청을 넘길 백엔드 주소.
ENV BACKEND_URL=http://egov-simple-api:8090

COPY --from=build /workspace/dist /usr/share/nginx/html

# /etc/nginx/templates/*.template 이 envsubst 를 거쳐 conf.d 로 전개된다.
# ${BACKEND_URL} 만 치환하고 nginx 자체 변수($uri 등)는 건드리지 않도록 대상을 한정한다.
ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template \
    NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d \
    NGINX_ENVSUBST_FILTER=BACKEND_URL

COPY <<'NGINX' /etc/nginx/templates/default.conf.template
server {
  listen 8080;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # 백엔드 리버스 프록시.
  # 이 백엔드는 context-path 가 /api 라서 접두어를 떼지 않고 그대로 넘긴다
  # (proxy_pass 뒤에 경로를 붙이지 않으면 원래 URI 가 유지된다).
  location /api/ {
    proxy_pass ${BACKEND_URL};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    # 인증은 HttpOnly 쿠키라 경로를 그대로 두어야 브라우저가 쿠키를 다시 보낸다.
    proxy_cookie_path / /;
    client_max_body_size 20m;
    proxy_read_timeout 120s;
  }

  # SPA 이므로 하위 경로로 새로고침해도 index.html 로 보낸다.
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Vite 가 파일명에 해시를 넣으므로 정적 자산은 길게 캐시한다.
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }

  # 진입점은 캐시하지 않는다 — 새 배포가 즉시 반영되어야 한다.
  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
}
NGINX

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
