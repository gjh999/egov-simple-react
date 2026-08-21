import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { memberApi } from '../api/member'
import { ApiError } from '../api/client'
import { hashPassword } from '../auth/password'
import { useI18n } from '../i18n/I18nContext'
import { ErrorMessage } from '../components/Feedback'

/**
 * 회원가입.
 *
 * <p>비밀번호는 로그인과 같은 규칙으로 <b>1차 해시해서</b> 보낸다 —
 * 저장값이 이중 해시이고 서버가 나머지 한 번을 담당하기 때문이다.
 * 평문을 보내면 저장은 되지만 이후 로그인이 되지 않는다.</p>
 */
export function RegisterPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [mberId, setMberId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mberNm, setMberNm] = useState('')
  const [mberEmailAdres, setMberEmailAdres] = useState('')
  const [moblphonNo, setMoblphonNo] = useState('')

  const [idChecked, setIdChecked] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleCheckId = async () => {
    setError(null)
    if (!mberId) return
    try {
      const result = await memberApi.checkId(mberId)
      // 서버가 사용중 건수(usedCnt) 또는 숫자를 돌려준다 — 0 이면 사용 가능
      const usedCount = typeof result === 'number' ? result : (result?.usedCnt ?? 0)
      const available = usedCount === 0
      setIdChecked(available)
      if (!available) {
        setError(t('join.idTaken', '이미 사용 중인 아이디입니다.'))
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('join.idCheckFail', '아이디를 확인하지 못했습니다.'))
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (idChecked !== true) {
      setError(t('join.needIdCheck', '아이디 중복 확인을 해 주세요.'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('join.pwMismatch', '비밀번호가 서로 일치하지 않습니다.'))
      return
    }

    setSubmitting(true)
    try {
      await memberApi.register({
        mberId,
        // 로그인과 같은 1차 해시 (저장값은 이중 해시)
        password: await hashPassword(mberId, password),
        mberNm,
        mberEmailAdres,
        moblphonNo,
      })
      navigate('/login', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('join.fail', '가입하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-6">
        <h1 className="h3 mb-3">{t('nav.join', '회원가입')}</h1>

        {error && <ErrorMessage message={error} />}

        <form className="krds-panel" onSubmit={handleSubmit} noValidate>
          <div className="krds-panel-body">
            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="reg-id">
                  {t('login.id', '아이디')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts d-flex gap-2">
                <input
                  id="reg-id"
                  className="krds-input"
                  type="text"
                  value={mberId}
                  onChange={(e) => {
                    setMberId(e.target.value)
                    setIdChecked(null)
                  }}
                  required
                />
                <button
                  type="button"
                  className="krds-btn secondary flex-shrink-0"
                  onClick={handleCheckId}
                  disabled={!mberId}
                >
                  {t('join.checkId', '중복확인')}
                </button>
              </div>
              {idChecked === true && (
                <p className="form-hint text-primary">{t('join.idAvailable', '사용할 수 있는 아이디입니다.')}</p>
              )}
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="reg-name">
                  {t('mypage.name', '이름')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts">
                <input
                  id="reg-name"
                  className="krds-input"
                  type="text"
                  value={mberNm}
                  onChange={(e) => setMberNm(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="reg-email">{t('mypage.email', '이메일')}</label>
              </div>
              <div className="form-conts">
                <input
                  id="reg-email"
                  className="krds-input"
                  type="email"
                  value={mberEmailAdres}
                  onChange={(e) => setMberEmailAdres(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="reg-phone">{t('member.phone', '휴대전화')}</label>
              </div>
              <div className="form-conts">
                <input
                  id="reg-phone"
                  className="krds-input"
                  type="tel"
                  value={moblphonNo}
                  onChange={(e) => setMoblphonNo(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="reg-pw">
                  {t('login.password', '비밀번호')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts">
                <input
                  id="reg-pw"
                  className="krds-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <p className="form-hint">{t('mypage.pwHint', '8자 이상 입력하세요.')}</p>
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="reg-pw-confirm">
                  {t('mypage.confirmPw', '비밀번호 확인')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts">
                <input
                  id="reg-pw-confirm"
                  className="krds-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="krds-panel-body border-top d-flex gap-2">
            <button type="submit" className="krds-btn primary" disabled={submitting}>
              {submitting ? t('com.processing', '처리 중…') : t('nav.join', '회원가입')}
            </button>
            <Link to="/login" className="krds-btn tertiary">
              {t('com.cancel', '취소')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
