# API 계약 — 이 폴더는 짝 저장소와 동일해야 합니다

이 폴더(`src/api/`)와 `src/auth/password.ts` 는 **React 판과 Vue 판이 글자 하나까지 같은 파일**입니다.
저장소가 분리돼 있으므로 자동으로 맞춰지지 않습니다 — **한쪽만 고치면 두 화면이 서로 다르게 동작합니다.**

| 이 저장소 | 짝 저장소 | 백엔드 |
|---|---|---|
| egov-simple-react | egov-simple-vue | egov-simple-api |

## 고쳐야 할 때의 절차

1. 백엔드(`egov-simple-api`)를 먼저 고치고 배포한다.
2. 이 폴더를 고친다.
3. **같은 내용을 짝 저장소에도 반영한다.** 아래 파일 목록 전부가 동기화 대상이다.
4. 양쪽에서 `npm run test` 를 돌려 계약 테스트가 통과하는지 확인한다.

## 동기화 대상 파일

```
src/api/client.ts      fetch 래퍼 · 응답 래핑 흡수 · 401 처리
src/api/types.ts       서버 DTO 타입
src/api/auth.ts        로그인 · 로그아웃 · 현재 사용자
src/api/board.ts       게시판
src/api/schedule.ts    일정 · 메인
src/api/member.ts      회원 · 마이페이지
src/api/admin.ts       게시판 마스터 · 사용정보 · 관리자 비밀번호
src/auth/password.ts   비밀번호 1차 해시
```

## 깨지면 조용히 망가지는 계약

아래는 서버와 프론트가 맞춰야 하는 약속이다. 어긋나도 컴파일은 되고 **런타임에 조용히 실패**한다.

### 1. 비밀번호 해시 — API 마다 규칙이 다르다 ⚠️

| API | 프론트가 보내는 값 | 서버가 하는 일 |
|---|---|---|
| 로그인 `POST /auth/login-jwt` | `Base64(SHA-256(id ‖ password))` **1차 해시** | 한 번 더 해싱해 저장값(이중해시)과 비교 |
| 회원가입 `POST /etc/member_insert` | **1차 해시** | 한 번 더 해싱해 저장 |
| 관리자 비밀번호 변경 `PATCH /admin/password` | **평문** | `encryptPasswordTwice` 로 이중 해시를 직접 만듦 |

세 번째만 규칙이 다르다. 여기서 미리 해싱하면 서버가 그 값을 또 이중 해시해 **절대 맞지 않는다.**

`hashPassword(id, password)` 는 서버의 `EgovFileScrty.encryptPassword(password, id)` 와
바이트 단위로 같은 계산이어야 한다(MessageDigest 에 salt 로 id 를 update 한 뒤 password 를 digest).
`src/test/password.test.ts` 가 고정 기대값으로 이 계약을 잡아 둔다.

### 2. 인증은 HttpOnly 쿠키다

모든 요청에 `credentials: 'include'` 가 필요하다. 빠뜨리면 인증 요청이 전부 401 이 된다.
토큰은 JS 가 읽을 수 없으므로, 로그인 여부는 앱 시작 시 `GET /auth/me` 로 물어본다.

### 3. 응답 래핑이 두 가지다

```jsonc
{ "resultCode": 200,   "result":   { ... } }   // IntermediateResultVO
{ "resultCode": "200", "resultVO": { ... } }   // 로그인 등 구형 컨트롤러
```

`client.ts` 의 `unwrap()` 이 둘을 흡수한다. `resultCode` 는 HTTP 상태와 **별개**다 —
HTTP 200 이어도 `resultCode` 가 401/403/900 일 수 있다.

### 4. 일정의 `month` 는 0-based

서버가 `java.util.Calendar` 규약을 그대로 노출한다(1월=0, 8월=7).
JavaScript `Date#getMonth()` 와 같은 기준이라 변환 없이 넘긴다. 여기에 +1 을 하면 한 달씩 밀린다.

### 5. 일정 일시는 `yyyyMMddHHmm` 문자열

브라우저의 `datetime-local` 은 `yyyy-MM-ddTHH:mm` 이라 양방향 변환이 필요하다.
빠뜨리면 저장은 되는데 목록에 이상한 날짜가 찍힌다.
