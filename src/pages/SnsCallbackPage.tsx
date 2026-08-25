import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { completeSnsLogin } from '../api/sns'
import type { SnsProvider } from '../api/sns'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ErrorMessage, Loading } from '../components/Feedback'

/**
 * SNS 로그인 콜백 화면.
 *
 * 공급자가 이 주소로 되돌려보내면 `code` 를 백엔드에 넘긴다.
 * 백엔드가 토큰을 교환해 ACCESS_TOKEN 쿠키를 심으므로, 여기서는 인증 상태만 다시 읽고
 * 홈으로 보낸다 — 응답 본문에 토큰이 없으니 프론트가 저장할 것이 없다.
 */
export function SnsCallbackPage() {
  const { provider } = useParams<{ provider: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)

  // React 18 이상의 StrictMode 는 effect 를 두 번 실행한다.
  // 인가 코드는 한 번만 쓸 수 있으므로 두 번째 호출은 반드시 막아야 한다.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const denied = searchParams.get('error')

    if (denied) {
      setError(t('login.sns.denied', 'SNS 로그인이 취소되었습니다.'))
      return
    }
    if (!code || (provider !== 'kakao' && provider !== 'naver')) {
      setError(t('login.sns.badRequest', '잘못된 접근입니다.'))
      return
    }

    completeSnsLogin(provider as SnsProvider, code, state)
      .then(() => refresh())
      .then(() => navigate('/', { replace: true }))
      .catch(() => setError(t('login.sns.fail', 'SNS 로그인에 실패했습니다.')))
  }, [provider, searchParams, refresh, navigate, t])

  if (error) {
    return <ErrorMessage message={error} onRetry={() => navigate('/login', { replace: true })} />
  }
  return <Loading label={t('login.sns.processing', 'SNS 로그인 처리 중…')} />
}
