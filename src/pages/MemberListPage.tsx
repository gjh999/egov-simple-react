import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { memberApi } from '../api/member'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback'
import { Pagination } from '../components/Pagination'

/** 회원 관리 (ROLE_ADMIN 전용) */
export function MemberListPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()

  const pageIndex = Number(searchParams.get('page') ?? '1')
  const searchCondition = searchParams.get('cnd') ?? '0'
  const searchKeyword = searchParams.get('wrd') ?? ''

  const [condition, setCondition] = useState(searchCondition)
  const [keyword, setKeyword] = useState(searchKeyword)

  const { data, loading, error, reload } = useAsync(
    () => memberApi.list({ pageIndex, searchCondition, searchKeyword }),
    [pageIndex, searchCondition, searchKeyword],
  )

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setSearchParams({ page: '1', cnd: condition, wrd: keyword })
  }

  const members = data?.resultList ?? []

  return (
    <>
      <h1 className="h3 mb-3">{t('nav.member', '회원관리')}</h1>

      <form className="d-flex gap-2 mb-3" onSubmit={handleSearch} role="search">
        <label className="visually-hidden" htmlFor="member-condition">
          {t('member.searchCondition', '검색 조건')}
        </label>
        <select
          id="member-condition"
          className="krds-form-select"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="0">{t('mypage.name', '이름')}</option>
          <option value="1">{t('login.id', '아이디')}</option>
        </select>

        <label className="visually-hidden" htmlFor="member-keyword">
          {t('bbs.searchKeyword', '검색어')}
        </label>
        <input
          id="member-keyword"
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
          {members.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="krds-table-wrap">
              <table className="tbl">
                <caption>{t('member.listCaption', '회원 목록 — 아이디, 이름, 이메일, 상태')}</caption>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t('login.id', '아이디')}</th>
                    <th scope="col">{t('mypage.name', '이름')}</th>
                    <th scope="col">{t('mypage.email', '이메일')}</th>
                    <th scope="col">{t('member.status', '상태')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.uniqId}>
                      <td>{member.mberId ?? member.emplyrId ?? '-'}</td>
                      <td>{member.mberNm ?? member.userNm ?? '-'}</td>
                      <td className="text-start">{member.emailAdres ?? '-'}</td>
                      <td>{member.mberSttus ?? member.emplyrSttusCode ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.paginationInfo && (
            <Pagination
              info={data.paginationInfo}
              onChange={(pageNo) =>
                setSearchParams({ page: String(pageNo), cnd: searchCondition, wrd: searchKeyword })
              }
            />
          )}
        </>
      )}
    </>
  )
}
