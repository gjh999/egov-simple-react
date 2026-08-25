# 기능 점검 결과

이 문서는 저장소를 실제로 기동해 확인한 결과입니다. 수치는 자동 점검 스크립트의 출력이며,
화면은 같은 시점에 Chrome 으로 촬영했습니다(`docs/screenshots/`).

## 점검 환경

| 항목 | 값 |
|---|---|
| 점검일 | 2026-08-22 |
| OS | Windows 11 |
| JDK | 17 (Temurin 17.0.17+10) |
| Maven | 3.9.9 |
| Node.js | 22.14.0 / npm 10.9.2 |
| DB | 내장 HSQLDB (시드 자동 적재) |
| 브라우저 | Chrome (headless, 1440x900) |

## 결과 요약

**4 / 4 통과**

| 결과 | 구분 | 항목 | 상세 |
|---|---|---|---|
| PASS | 화면 | 앱 진입 | HTTP 200, 1617 bytes |
| PASS | 화면 | KRDS 자산 로컬 참조 | index.html 에서 public/krds 참조 |
| PASS | 화면 | CDN 미사용 | 외부 CDN 링크 없음 |
| PASS | 화면 | 백엔드 프록시 | HTTP 200, 메시지키 828 |

## 재현 방법

README 의 "빠른 시작" 대로 기동한 뒤, 아래를 확인하면 같은 결과를 얻습니다.

```bash
npm run test    # 단위 테스트
npm run build   # 타입 검사 + 번들 빌드
npm run dev     # 개발 서버 (백엔드가 먼저 떠 있어야 합니다)
```

