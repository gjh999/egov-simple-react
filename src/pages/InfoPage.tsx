import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { NotFoundPage } from './NotFoundPage'

/**
 * 사이트 소개 화면.
 *
 * 서버 렌더링 판은 소개 4종(사이트소개·연혁·조직·찾아오시는 길)을 각각 별도 HTML 로 두었지만
 * 구조가 <b>제목 + 본문 패널</b>로 같고 문구만 다르다. 문구는 서버 메시지 번들에 있으므로
 * 화면 하나가 슬러그별 키 접두어만 바꿔 그린다 — 항목이 늘어도 아래 목록에 한 줄만 더하면 된다.
 */

/** 슬러그 → 메시지 키 접두어 (서버 번들의 키와 맞춰야 한다) */
const PAGES: Record<string, { prefix: string; icon: string }> = {
  about: { prefix: 'about', icon: 'bi-building' },
  history: { prefix: 'history', icon: 'bi-clock-history' },
  organization: { prefix: 'org', icon: 'bi-diagram-3' },
  location: { prefix: 'location', icon: 'bi-geo-alt' },
}

export function InfoPage() {
  const { slug = 'about' } = useParams()
  const { t } = useI18n()

  const page = PAGES[slug]
  if (!page) {
    return <NotFoundPage />
  }

  const { prefix, icon } = page

  return (
    <>
      <nav aria-label={t('com.breadcrumb', '현재 위치')}>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">{t('nav.home', '홈')}</Link>
          </li>
          <li className="breadcrumb-item">{t('nav.introGroup', '사이트 소개')}</li>
          <li className="breadcrumb-item active" aria-current="page">
            {t(`${prefix}.title`)}
          </li>
        </ol>
      </nav>

      <div className="d-flex align-items-center gap-2 mb-2">
        <i className={`bi ${icon} fs-4 text-primary`} aria-hidden="true" />
        <span className="text-muted small">{t(`${prefix}.eyebrow`)}</span>
      </div>
      <h1 className="h3 mb-2">{t(`${prefix}.heading`)}</h1>
      <p className="text-muted mb-4">{t(`${prefix}.lead`)}</p>

      <div className="krds-panel">
        <div className="krds-panel-head fw-bold">{t(`${prefix}.panel.title`)}</div>
        <div className="krds-panel-body">
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
            {t(`${prefix}.body`)}
          </p>
        </div>
      </div>
    </>
  )
}
