// vitest 설정(test 블록)을 같은 파일에 두기 위해 vitest/config 의 defineConfig 를 쓴다.
// vite 의 defineConfig 는 test 키를 모른다.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // 개발 중에는 /api 요청을 백엔드로 프록시한다.
    // 프록시를 쓰면 브라우저에서는 동일 출처(3000)로 보이므로 쿠키가 SameSite 제약 없이 실린다.
    // (프록시 없이 http://localhost:8090/api 를 직접 호출해도 동작한다 — 백엔드 CORS 화이트리스트에
    //  3000/3001 가 등록돼 있고 credentials 를 허용한다.)
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
