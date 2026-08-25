import { snsEnabled, startSnsLogin } from '../api/sns'
import { useI18n } from '../i18n/I18nContext'

/**
 * SNS 간편 로그인 버튼.
 *
 * 백엔드에 공급자 키가 없으면 눌러 봐야 공급자 오류 화면으로 빠지므로,
 * `VITE_SNS_ENABLED` 가 켜져 있을 때만 그린다(기본 꺼짐).
 */
export function SnsLoginButtons() {
  const { t } = useI18n()

  if (!snsEnabled) return null

  return (
    <div className="mt-4">
      <p className="text-center text-muted small mb-2">{t('login.sns', 'SNS 계정으로 로그인')}</p>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="krds-btn secondary w-100"
          onClick={() => startSnsLogin('kakao')}
        >
          {t('login.sns.kakao', '카카오')}
        </button>
        <button
          type="button"
          className="krds-btn secondary w-100"
          onClick={() => startSnsLogin('naver')}
        >
          {t('login.sns.naver', '네이버')}
        </button>
      </div>
    </div>
  )
}
