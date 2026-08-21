import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
// PagedResult 는 관리자 화면 골격이 기대하는 목록 응답 형태다 (api/admin.ts 에 정의)
import type { PagedResult } from '../api/admin'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { EmptyState, ErrorMessage, Loading } from './Feedback'
import { Pagination } from './Pagination'

/** 목록에 그릴 컬럼 하나 */
export interface Column<T> {
  /** 헤더 라벨 */
  header: string
  /** 셀 내용 */
  cell: (row: T) => ReactNode
  /** colgroup 폭 (예: '15%') — 생략하면 남는 폭을 나눠 갖는다 */
  width?: string
  /** 왼쪽 정렬 (제목·설명처럼 긴 텍스트) */
  alignStart?: boolean
}

/** 편집 폼의 입력 필드 하나 */
export interface Field {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date'
  required?: boolean
  /** select 일 때의 선택지 */
  options?: { value: string; label: string }[]
  hint?: string
  /** 수정 시 잠글 필드 (기본키 등) */
  readOnlyOnEdit?: boolean
}

interface Props<T> {
  title: string
  /** 표 caption — 스크린리더가 표의 내용을 먼저 알 수 있게 한다 */
  caption: string
  columns: Column<T>[]
  /** 목록 조회 */
  fetchList: (pageIndex: number, keyword: string) => Promise<PagedResult<T>>
  /** 목록 갱신을 유발하는 추가 의존성 */
  deps?: unknown[]
  /** 행의 React key */
  rowKey: (row: T) => string
  /** 편집 폼 필드 — 생략하면 조회 전용 화면이 된다 */
  fields?: Field[]
  /** 행을 폼 초기값으로 바꾼다 */
  toFormValues?: (row: T) => Record<string, string>
  onCreate?: (values: Record<string, string>) => Promise<unknown>
  onUpdate?: (row: T, values: Record<string, string>) => Promise<unknown>
  onDelete?: (row: T) => Promise<unknown>
  /** 검색어 입력을 보여줄지 */
  searchable?: boolean
  searchPlaceholder?: string
}

/**
 * 관리자 CRUD 화면의 공통 골격.
 *
 * <p>서버 렌더링 판은 도메인마다 목록·등록·수정·상세 네 개의 화면(=네 개의 URL)을 따로 두었다.
 * SPA 에서는 <b>목록 화면 안에서 폼이 열리고 닫힌다</b> — 화면을 오갈 때마다 목록을 다시 불러오고
 * 검색 조건과 페이지를 잃어버리는 흐름을 없애기 위해서다.</p>
 *
 * <p>관리자 화면 20여 개가 표 + 폼이라는 같은 모양이라 골격을 하나로 모았다.
 * 도메인마다 다른 것은 컬럼 정의·필드 정의·API 호출 세 가지뿐이다.</p>
 */
export function AdminCrudPage<T>({
  title,
  caption,
  columns,
  fetchList,
  deps = [],
  rowKey,
  fields,
  toFormValues,
  onCreate,
  onUpdate,
  onDelete,
  searchable = true,
  searchPlaceholder,
}: Props<T>) {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()

  const pageIndex = Number(searchParams.get('page') ?? '1')
  const keyword = searchParams.get('wrd') ?? ''

  const [searchInput, setSearchInput] = useState(keyword)
  /** null = 폼 닫힘, 'new' = 등록, 그 외 = 수정 대상 행 */
  const [editing, setEditing] = useState<T | 'new' | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data, loading, error, reload } = useAsync<PagedResult<T>>(
    () => fetchList(pageIndex, keyword),
    [pageIndex, keyword, ...deps],
  )

  const rows: T[] = data?.resultList ?? []
  const editable = Boolean(fields && (onCreate || onUpdate))

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setSearchParams({ page: '1', wrd: searchInput })
  }

  const openCreate = () => {
    setEditing('new')
    setValues({})
    setFormError(null)
  }

  const openEdit = (row: T) => {
    setEditing(row)
    setValues(toFormValues ? toFormValues(row) : {})
    setFormError(null)
  }

  const closeForm = () => {
    setEditing(null)
    setFormError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (editing === 'new') {
        await onCreate?.(values)
      } else if (editing) {
        await onUpdate?.(editing, values)
      }
      closeForm()
      reload()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t('com.saveFail', '저장하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: T) => {
    if (!window.confirm(t('com.confirmDelete', '삭제하시겠습니까?'))) return
    try {
      await onDelete?.(row)
      reload()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t('com.deleteFail', '삭제하지 못했습니다.'))
    }
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 mb-0">{title}</h1>
        {editable && onCreate && (
          <button type="button" className="krds-btn primary" onClick={openCreate}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> {t('com.create', '등록')}
          </button>
        )}
      </div>

      {searchable && (
        <form className="d-flex gap-2 mb-3" onSubmit={handleSearch} role="search">
          <label className="visually-hidden" htmlFor="admin-keyword">
            {t('bbs.searchKeyword', '검색어')}
          </label>
          <input
            id="admin-keyword"
            className="krds-input"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder ?? t('bbs.searchPlaceholder', '검색어를 입력하세요')}
          />
          <button type="submit" className="krds-btn secondary flex-shrink-0">
            {t('com.search', '검색')}
          </button>
        </form>
      )}

      {formError && <ErrorMessage message={formError} />}

      {/* 편집 폼 — 목록 위에 펼쳐진다 */}
      {editing && fields && (
        <form className="krds-panel mb-4" onSubmit={handleSubmit}>
          <div className="krds-panel-head">
            <h2 className="h5 mb-0">
              {editing === 'new' ? t('com.create', '등록') : t('com.edit', '수정')}
            </h2>
          </div>
          <div className="krds-panel-body">
            {fields.map((field) => {
              const id = `field-${field.name}`
              const locked = editing !== 'new' && field.readOnlyOnEdit
              return (
                <div className="form-group" key={field.name}>
                  <div className="form-tit">
                    <label htmlFor={id}>
                      {field.label}
                      {field.required && <span className="frm-rq"> *</span>}
                    </label>
                  </div>
                  <div className="form-conts">
                    {field.type === 'textarea' ? (
                      <textarea
                        id={id}
                        className="krds-input"
                        rows={8}
                        value={values[field.name] ?? ''}
                        onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={id}
                        className="krds-form-select"
                        value={values[field.name] ?? ''}
                        onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                        required={field.required}
                      >
                        <option value="">{t('com.select', '선택')}</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        className="krds-input"
                        type={field.type ?? 'text'}
                        value={values[field.name] ?? ''}
                        onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                        required={field.required}
                        readOnly={locked}
                      />
                    )}
                    {field.hint && <p className="form-hint">{field.hint}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="krds-panel-body border-top d-flex gap-2">
            <button type="submit" className="krds-btn primary" disabled={submitting}>
              {submitting ? t('com.processing', '처리 중…') : t('com.save', '저장')}
            </button>
            <button type="button" className="krds-btn tertiary" onClick={closeForm}>
              {t('com.cancel', '취소')}
            </button>
          </div>
        </form>
      )}

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="krds-table-wrap">
              <table className="tbl">
                <caption>{caption}</caption>
                <colgroup>
                  {columns.map((col, i) => (
                    <col key={i} style={col.width ? { width: col.width } : undefined} />
                  ))}
                  {editable && <col style={{ width: '14%' }} />}
                </colgroup>
                <thead>
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} scope="col">
                        {col.header}
                      </th>
                    ))}
                    {editable && <th scope="col">{t('com.manage', '관리')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={rowKey(row)}>
                      {columns.map((col, i) => (
                        <td key={i} className={col.alignStart ? 'text-start' : undefined}>
                          {col.cell(row)}
                        </td>
                      ))}
                      {editable && (
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            {onUpdate && (
                              <button
                                type="button"
                                className="krds-btn secondary small"
                                onClick={() => openEdit(row)}
                              >
                                {t('com.edit', '수정')}
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                className="krds-btn danger small"
                                onClick={() => handleDelete(row)}
                              >
                                {t('com.delete', '삭제')}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.paginationInfo && (
            <Pagination
              info={data.paginationInfo}
              onChange={(pageNo) => setSearchParams({ page: String(pageNo), wrd: keyword })}
            />
          )}
        </>
      )}
    </>
  )
}
