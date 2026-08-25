import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { scheduleApi } from '../api/schedule'
import { ApiError } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback'
import type { Schedule } from '../api/types'

/** 조회 단위 — 서버의 /schedule/{month|week|daily} 에 그대로 대응한다. */
type ScheduleView = 'month' | 'week' | 'daily'

/** yyyyMMddHHmm → yyyy-MM-dd HH:mm (서버가 붙여 보내는 원시 형식을 사람이 읽게 바꾼다) */
function formatDateTime(raw: string | undefined): string {
  if (!raw || raw.length < 8) return raw ?? ''
  const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  if (raw.length < 12) return date
  return `${date} ${raw.slice(8, 10)}:${raw.slice(10, 12)}`
}

export function SchedulePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const today = new Date()

  const [year, setYear] = useState(today.getFullYear())
  // 서버의 month 는 0-based 다(Calendar 규약). Date#getMonth() 와 같은 기준이라 그대로 쓴다.
  const [month, setMonth] = useState(today.getMonth())
  const [date, setDate] = useState(today.getDate())
  // 월간 · 주간 · 일간 — 서버가 세 조회를 모두 제공하므로 화면에서 고르게 한다.
  const [view, setView] = useState<ScheduleView>('month')
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useAsync(() => {
    if (view === 'week') return scheduleApi.week({ year, month, date })
    if (view === 'daily') return scheduleApi.daily({ year, month, date })
    return scheduleApi.month({ year, month })
  }, [view, year, month, date])

  const handleDelete = async (schdulId: string) => {
    if (!window.confirm(t('schedule.confirmDelete', '이 일정을 삭제하시겠습니까?'))) return
    setActionError(null)
    try {
      await scheduleApi.remove(schdulId)
      reload()
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t('com.deleteFail', '삭제하지 못했습니다.'))
    }
  }

  /** 보기 단위만큼 앞뒤로 옮긴다 — 월간은 한 달, 주간은 7일, 일간은 하루. */
  const move = (delta: number) => {
    const step = view === 'month' ? 0 : view === 'week' ? 7 * delta : delta
    const next =
      view === 'month'
        ? new Date(year, month + delta, 1)
        : new Date(year, month, date + step)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    if (view !== 'month') setDate(next.getDate())
  }

  const goToday = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setDate(now.getDate())
  }

  /** 현재 보고 있는 기간 표시 */
  const periodLabel = () => {
    const ym = `${year}. ${String(month + 1).padStart(2, '0')}`
    if (view === 'month') return ym
    if (view === 'daily') return `${ym}. ${String(date).padStart(2, '0')}`
    // 주간은 일요일~토요일 범위를 보여준다(서버도 같은 기준으로 한 주를 판단한다).
    const base = new Date(year, month, date)
    const start = new Date(base)
    start.setDate(base.getDate() - base.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const fmt = (d: Date) =>
      `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
    return `${fmt(start)} ~ ${fmt(end)}`
  }

  const schedules = (data?.resultList ?? []) as Schedule[]

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 mb-0">{t('nav.schedule', '일정관리')}</h1>
        <Link to="/schedule/write" className="krds-btn primary">
          <i className="bi bi-plus-lg" aria-hidden="true" /> {t('schedule.write', '일정 등록')}
        </Link>
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
        <div className="btn-group" role="group" aria-label={t('schedule.view', '조회 단위')}>
          {(['month', 'week', 'daily'] as ScheduleView[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`krds-btn small ${view === v ? 'primary' : 'tertiary'}`}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v === 'month'
                ? t('schedule.view.month', '월간')
                : v === 'week'
                  ? t('schedule.view.week', '주간')
                  : t('schedule.view.daily', '일간')}
            </button>
          ))}
        </div>

        <button type="button" className="krds-btn tertiary small" onClick={() => move(-1)}>
          <i className="bi bi-chevron-left" aria-hidden="true" /> {t('com.prev', '이전')}
        </button>
        <strong aria-live="polite">{periodLabel()}</strong>
        <button type="button" className="krds-btn tertiary small" onClick={() => move(1)}>
          {t('com.next', '다음')} <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
        <button type="button" className="krds-btn secondary small ms-2" onClick={goToday}>
          {t('schedule.today', '오늘')}
        </button>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          {schedules.length === 0 ? (
            <EmptyState>{t('schedule.empty', '해당 기간에 등록된 일정이 없습니다.')}</EmptyState>
          ) : (
            <div className="krds-table-wrap">
              <table className="tbl">
                <caption>{t('schedule.listCaption', '일정 목록 — 일정명, 구분, 시작, 종료, 장소, 관리')}</caption>
                <colgroup>
                  <col />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t('schedule.name', '일정명')}</th>
                    <th scope="col">{t('schedule.type', '구분')}</th>
                    <th scope="col">{t('schedule.begin', '시작')}</th>
                    <th scope="col">{t('schedule.end', '종료')}</th>
                    <th scope="col">{t('schedule.place', '장소')}</th>
                    <th scope="col">{t('com.manage', '관리')}</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item) => (
                    <tr key={item.schdulId}>
                      <td className="text-start">{item.schdulNm}</td>
                      <td>
                        {data?.schdulSe?.find((code) => code.code === item.schdulSe)?.codeNm ?? item.schdulSe}
                      </td>
                      <td>{formatDateTime(item.schdulBgnde)}</td>
                      <td>{formatDateTime(item.schdulEndde)}</td>
                      <td>{item.schdulPlace ?? '-'}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            type="button"
                            className="krds-btn secondary small"
                            onClick={() => navigate(`/schedule/${item.schdulId}/edit`)}
                          >
                            {t('com.edit', '수정')}
                          </button>
                          <button
                            type="button"
                            className="krds-btn danger small"
                            onClick={() => handleDelete(item.schdulId)}
                          >
                            {t('com.delete', '삭제')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}
