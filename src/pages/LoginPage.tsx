import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ApiError } from '../api/client'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { t } = useI18n()
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 이미 로그인한 상태로 로그인 화면에 오면 원래 목적지(또는 홈)로 보낸다
  if (!authLoading && isAuthenticated) {
    const from = (location.state as LocationState | null)?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(id, password)
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('login.fail', '아이디 또는 비밀번호가 올바르지 않습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-4">
        <div className="krds-panel">
          <div className="krds-panel-head">
            <h1 className="h4 mb-0">{t('login.title', '로그인')}</h1>
          </div>
          <div className="krds-panel-body">
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="krds-alert danger mb-3" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <div className="form-tit">
                  <label htmlFor="login-id">{t('login.id', '아이디')}</label>
                </div>
                <div className="form-conts">
                  <input
                    id="login-id"
                    className="krds-input"
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-tit">
                  <label htmlFor="login-password">{t('login.password', '비밀번호')}</label>
                </div>
                <div className="form-conts">
                  <input
                    id="login-password"
                    className="krds-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="krds-btn primary w-100 mt-3" disabled={submitting || !id || !password}>
                {submitting ? t('com.processing', '처리 중…') : t('login.submit', '로그인')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
