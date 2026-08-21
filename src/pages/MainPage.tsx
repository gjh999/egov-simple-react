import { Link } from 'react-router-dom'
import { mainApi } from '../api/schedule'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback'
import { GALLERY_BBS_ID, NOTICE_BBS_ID } from '../components/Layout'
import type { BoardListItem } from '../api/types'

export function MainPage() {
  const { t } = useI18n()
  const { data, loading, error, reload } = useAsync(() => mainApi.summary(), [])

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  return (
    <>
      <h1 className="h3 mb-4">{t('main.title', '전자정부표준프레임워크 심플 홈페이지')}</h1>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <BoardSummaryCard
            title={t('nav.notice', '공지사항')}
            bbsId={NOTICE_BBS_ID}
            items={data?.notiList ?? []}
          />
        </div>
        <div className="col-12 col-lg-6">
          <BoardSummaryCard
            title={t('nav.gallery', '갤러리')}
            bbsId={GALLERY_BBS_ID}
            items={data?.galleryList ?? []}
          />
        </div>
      </div>
    </>
  )
}

function BoardSummaryCard({ title, bbsId, items }: { title: string; bbsId: string; items: BoardListItem[] }) {
  const { t } = useI18n()

  return (
    <section className="krds-panel h-100">
      <div className="krds-panel-head d-flex align-items-center justify-content-between">
        <h2 className="h5 mb-0">{title}</h2>
        <Link to={`/board/${bbsId}`} className="krds-btn tertiary small">
          {t('com.more', '더보기')}
        </Link>
      </div>
      <div className="krds-panel-body">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="list-unstyled mb-0">
            {items.slice(0, 5).map((item) => (
              <li key={`${item.bbsId}-${item.nttId}`} className="d-flex justify-content-between gap-3 py-2 border-bottom">
                <Link to={`/board/${item.bbsId}/${item.nttId}`} className="text-truncate">
                  {item.nttSj}
                </Link>
                <span className="small text-muted flex-shrink-0">{item.frstRegisterPnttm}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
