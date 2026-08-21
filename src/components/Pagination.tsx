import type { PaginationInfo } from '../api/types'
import { useI18n } from '../i18n/I18nContext'

interface Props {
  info: PaginationInfo
  onChange: (pageNo: number) => void
}

/**
 * 서버가 계산한 페이지 정보를 그대로 그리는 페이지네이션.
 *
 * 페이지 범위(firstPageNoOnPageList~lastPageNoOnPageList)를 서버가 정해 주므로
 * 클라이언트에서 다시 계산하지 않는다 — 두 곳에서 계산하면 반드시 어긋난다.
 */
export function Pagination({ info, onChange }: Props) {
  const { t } = useI18n()

  if (!info || info.totalPageCount <= 1) {
    return null
  }

  const pages: number[] = []
  for (let no = info.firstPageNoOnPageList; no <= info.lastPageNoOnPageList; no += 1) {
    pages.push(no)
  }

  const current = info.currentPageNo
  const hasPrev = current > 1
  const hasNext = current < info.totalPageCount

  return (
    <nav aria-label={t('com.pagination', '페이지 목록')} className="d-flex justify-content-center mt-4">
      <ul className="pagination mb-0">
        <li className={`page-item${hasPrev ? '' : ' disabled'}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => hasPrev && onChange(current - 1)}
            disabled={!hasPrev}
            aria-label={t('com.prevPage', '이전 페이지')}
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
        </li>

        {pages.map((pageNo) => (
          <li key={pageNo} className={`page-item${pageNo === current ? ' active' : ''}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onChange(pageNo)}
              aria-current={pageNo === current ? 'page' : undefined}
            >
              {pageNo}
            </button>
          </li>
        ))}

        <li className={`page-item${hasNext ? '' : ' disabled'}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => hasNext && onChange(current + 1)}
            disabled={!hasNext}
            aria-label={t('com.nextPage', '다음 페이지')}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
