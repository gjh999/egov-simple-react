import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="py-5 text-center">
      <h1 className="h3 mb-3">{t('error.notFound.title', '페이지를 찾을 수 없습니다')}</h1>
      <p className="text-muted mb-4">
        {t('error.notFound.desc', '주소가 변경되었거나 삭제된 페이지입니다.')}
      </p>
      <Link to="/" className="krds-btn primary">
        {t('nav.home', '홈')}
      </Link>
    </div>
  )
}
