import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { boardApi } from '../api/board'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback'
import { Pagination } from '../components/Pagination'

export function BoardListPage() {
  const { bbsId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()

  const pageIndex = Number(searchParams.get('page') ?? '1')
  const searchCnd = searchParams.get('cnd') ?? '0'
  const searchWrd = searchParams.get('wrd') ?? ''

  const [keyword, setKeyword] = useState(searchWrd)
  const [condition, setCondition] = useState(searchCnd)

  const { data, loading, error, reload } = useAsync(
    () => boardApi.list({ bbsId, pageIndex, searchCnd, searchWrd }),
    [bbsId, pageIndex, searchCnd, searchWrd],
  )

  const updateParams = (next: Record<string, string>) => {
    setSearchParams(next, { replace: false })
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    // 검색 조건이 바뀌면 항상 1페이지부터 — 3페이지에서 검색했는데 결과가 1페이지뿐이면 빈 화면이 된다
    updateParams({ page: '1', cnd: condition, wrd: keyword })
  }

  const boardName = data?.brdMstrVO?.bbsNm ?? t('nav.board', '게시판')

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 mb-0">{boardName}</h1>
        {isAuthenticated && (
          <Link to={`/board/${bbsId}/write`} className="krds-btn primary">
            <i className="bi bi-pencil" aria-hidden="true" /> {t('bbs.write', '글쓰기')}
          </Link>
        )}
      </div>

      <form className="d-flex gap-2 mb-3" onSubmit={handleSearch} role="search">
        <label className="visually-hidden" htmlFor="search-condition">
          {t('bbs.searchCondition', '검색 조건')}
        </label>
        <select
          id="search-condition"
          className="krds-form-select"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="0">{t('bbs.subject', '제목')}</option>
          <option value="1">{t('bbs.content', '내용')}</option>
          <option value="2">{t('bbs.writer', '작성자')}</option>
        </select>

        <label className="visually-hidden" htmlFor="search-keyword">
          {t('bbs.searchKeyword', '검색어')}
        </label>
        <input
          id="search-keyword"
          className="krds-input"
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('bbs.searchPlaceholder', '검색어를 입력하세요')}
        />

        <button type="submit" className="krds-btn secondary flex-shrink-0">
          {t('com.search', '검색')}
        </button>
      </form>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          {(data?.resultList?.length ?? 0) === 0 ? (
            <EmptyState />
          ) : (
            <div className="krds-table-wrap">
              <table className="tbl">
                <caption>{t('bbs.listCaption', '게시물 목록 — 번호, 제목, 작성자, 등록일, 조회수')}</caption>
                <colgroup>
                  <col style={{ width: '8%' }} />
                  <col />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t('bbs.no', '번호')}</th>
                    <th scope="col">{t('bbs.subject', '제목')}</th>
                    <th scope="col">{t('bbs.writer', '작성자')}</th>
                    <th scope="col">{t('bbs.date', '등록일')}</th>
                    <th scope="col">{t('bbs.hit', '조회')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.resultList?.map((item) => (
                    <tr key={item.nttId}>
                      <td>{item.nttId}</td>
                      <td className="text-start">
                        {/* 답변 글은 깊이만큼 들여쓴다 */}
                        <span style={{ paddingLeft: `${Number(item.replyLc ?? 0) * 1.25}rem` }}>
                          {Number(item.replyLc ?? 0) > 0 && (
                            <i className="bi bi-arrow-return-right me-1" aria-hidden="true" />
                          )}
                          <Link to={`/board/${item.bbsId}/${item.nttId}`}>{item.nttSj}</Link>
                        </span>
                      </td>
                      <td>{item.frstRegisterNm}</td>
                      <td>{item.frstRegisterPnttm}</td>
                      <td>{item.inqireCo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.paginationInfo && (
            <Pagination
              info={data.paginationInfo}
              onChange={(pageNo) => updateParams({ page: String(pageNo), cnd: searchCnd, wrd: searchWrd })}
            />
          )}
        </>
      )}
    </>
  )
}
