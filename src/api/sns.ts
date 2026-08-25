/**
 * SNS 간편 로그인 (카카오 · 네이버).
 *
 * 흐름은 **백엔드가 주도**한다.
 *
 * ```
 * 1. 버튼 클릭 → 브라우저를 {API}/login/{provider} 로 보낸다
 * 2. 백엔드가 state 를 만들어 보관하고 공급자 인증 페이지로 리다이렉트한다
 * 3. 공급자가 Sns.{provider}.callbackUrl (이 프론트의 /login/{provider}/callback) 로 되돌려보낸다
 * 4. 콜백 화면이 code·state 를 백엔드로 넘긴다
 * 5. 백엔드가 토큰을 교환하고 ACCESS_TOKEN 쿠키를 심는다
 * ```
 *
 * 클라이언트 ID 를 프론트에 두지 않는다 — 공급자 자격증명은 백엔드 설정에만 존재한다.
 * state 생성·검증도 백엔드가 하므로 프론트가 CSRF 방어를 흉내 낼 필요가 없다.
 */
import { api } from './client'

/** 지원하는 공급자 */
export type SnsProvider = 'kakao' | 'naver'

/**
 * SNS 로그인 사용 여부.
 *
 * 공급자 자격증명은 백엔드에 있고 프론트는 알 수 없으므로, 환경변수로 켠다.
 * 키를 넣지 않은 상태에서 버튼만 보이면 눌렀을 때 공급자 오류 화면으로 빠지므로
 * **기본값은 꺼짐**이다.
 */
export const snsEnabled = String(import.meta.env.VITE_SNS_ENABLED ?? '').toLowerCase() === 'true'

/** 인증 시작 — 브라우저를 백엔드로 넘긴다(리다이렉트 체인이라 fetch 로는 처리할 수 없다). */
export function startSnsLogin(provider: SnsProvider): void {
  const base = import.meta.env.VITE_API_BASE ?? '/api'
  window.location.href = `${base}/login/${provider}`
}

/**
 * 콜백 완료 — 공급자가 돌려준 code·state 를 백엔드에 넘긴다.
 *
 * 성공하면 백엔드가 ACCESS_TOKEN 쿠키를 심는다. 응답 본문에는 토큰이 없으므로
 * 호출한 쪽에서 `authApi.me()` 로 로그인 상태를 다시 읽어야 한다.
 */
export async function completeSnsLogin(
  provider: SnsProvider,
  code: string,
  state: string | null,
): Promise<void> {
  await api.get<unknown>(`/login/${provider}/callback`, {
    code,
    ...(state ? { state } : {}),
  })
}
