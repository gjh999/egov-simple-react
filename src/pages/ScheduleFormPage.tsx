import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { scheduleApi } from '../api/schedule'
import { ApiError } from '../api/client'
import { useI18n } from '../i18n/I18nContext'
import { ErrorMessage, Loading } from '../components/Feedback'
import type { CommonCode } from '../api/types'

interface Props {
  mode: 'create' | 'edit'
}

/** `yyyyMMddHHmm` ↔ `<input type="datetime-local">` 의 `yyyy-MM-ddTHH:mm` 변환 */
function toInputValue(raw: string | undefined): string {
  if (!raw || raw.length < 12) return ''
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}`
}

function toServerValue(input: string): string {
  // 2026-08-21T14:30 → 202608211430
  return input.replace(/[-T:]/g, '').slice(0, 12)
}

/**
 * 일정 등록 / 수정.
 *
 * 서버는 시작·종료 일시를 `yyyyMMddHHmm` 문자열로 주고받는다.
 * 브라우저의 datetime-local 입력은 `yyyy-MM-ddTHH:mm` 이라 양방향 변환이 필요하다 —
 * 이 변환을 빠뜨리면 저장은 되는데 목록에 이상한 날짜가 찍힌다.
 */
export function ScheduleFormPage({ mode }: Props) {
  const { schdulId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [schdulNm, setSchdulNm] = useState('')
  const [schdulCn, setSchdulCn] = useState('')
  const [schdulSe, setSchdulSe] = useState('')
  const [schdulBgnde, setSchdulBgnde] = useState('')
  const [schdulEndde, setSchdulEndde] = useState('')
  const [schdulPlace, setSchdulPlace] = useState('')
  /** 일정 구분 선택지 (공통코드 COM030) */
  const [codes, setCodes] = useState<CommonCode[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const now = new Date()

    // 일정 구분 선택지는 월별 조회 응답에 함께 온다 (별도 코드 API 가 없다)
    scheduleApi
      .month({ year: now.getFullYear(), month: now.getMonth() })
      .then((res) => {
        if (!cancelled) setCodes(res.schdulSe ?? [])
      })
      .catch(() => {
        if (!cancelled) setCodes([])
      })

    if (mode === 'create' || !schdulId) {
      setLoading(false)
      return
    }

    scheduleApi
      .detail(schdulId)
      .then((res) => {
        if (cancelled) return
        // 상세 응답은 컨트롤러에 따라 scheduleDetail 로 감싸 오기도 한다
        const detail = (res as { scheduleDetail?: typeof res }).scheduleDetail ?? res
        setSchdulNm(detail.schdulNm ?? '')
        setSchdulCn(detail.schdulCn ?? '')
        setSchdulSe(detail.schdulSe ?? '')
        setSchdulBgnde(toInputValue(detail.schdulBgnde))
        setSchdulEndde(toInputValue(detail.schdulEndde))
        setSchdulPlace(detail.schdulPlace ?? '')
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : t('schedule.loadFail', '일정을 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mode, schdulId, t])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (schdulBgnde && schdulEndde && schdulBgnde > schdulEndde) {
      setError(t('schedule.rangeError', '종료 일시가 시작 일시보다 빠릅니다.'))
      return
    }

    setSubmitting(true)
    try {
      const input = {
        schdulNm,
        schdulCn,
        schdulSe,
        schdulBgnde: toServerValue(schdulBgnde),
        schdulEndde: toServerValue(schdulEndde),
        schdulPlace,
      }
      if (mode === 'create') {
        await scheduleApi.create(input)
      } else {
        await scheduleApi.update(schdulId!, input)
      }
      navigate('/schedule', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('com.saveFail', '저장하지 못했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <h1 className="h3 mb-3">
          {mode === 'create' ? t('schedule.write', '일정 등록') : t('schedule.edit', '일정 수정')}
        </h1>

        {error && <ErrorMessage message={error} />}

        <form className="krds-panel" onSubmit={handleSubmit} noValidate>
          <div className="krds-panel-body">
            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="schdul-nm">
                  {t('schedule.name', '일정명')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts">
                <input
                  id="schdul-nm"
                  className="krds-input"
                  type="text"
                  value={schdulNm}
                  onChange={(e) => setSchdulNm(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="schdul-se">{t('schedule.type', '일정 구분')}</label>
              </div>
              <div className="form-conts">
                <select
                  id="schdul-se"
                  className="krds-form-select"
                  value={schdulSe}
                  onChange={(e) => setSchdulSe(e.target.value)}
                >
                  <option value="">{t('com.select', '선택')}</option>
                  {codes.map((code) => (
                    <option key={code.code} value={code.code}>
                      {code.codeNm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="schdul-bgnde">
                  {t('schedule.begin', '시작')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts">
                <input
                  id="schdul-bgnde"
                  className="krds-input"
                  type="datetime-local"
                  value={schdulBgnde}
                  onChange={(e) => setSchdulBgnde(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="schdul-endde">
                  {t('schedule.end', '종료')} <span className="frm-rq">*</span>
                </label>
              </div>
              <div className="form-conts">
                <input
                  id="schdul-endde"
                  className="krds-input"
                  type="datetime-local"
                  value={schdulEndde}
                  onChange={(e) => setSchdulEndde(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="schdul-place">{t('schedule.place', '장소')}</label>
              </div>
              <div className="form-conts">
                <input
                  id="schdul-place"
                  className="krds-input"
                  type="text"
                  value={schdulPlace}
                  onChange={(e) => setSchdulPlace(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-tit">
                <label htmlFor="schdul-cn">{t('schedule.content', '내용')}</label>
              </div>
              <div className="form-conts">
                <textarea
                  id="schdul-cn"
                  className="krds-input"
                  rows={8}
                  value={schdulCn}
                  onChange={(e) => setSchdulCn(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="krds-panel-body border-top d-flex gap-2">
            <button
              type="submit"
              className="krds-btn primary"
              disabled={submitting || !schdulNm || !schdulBgnde || !schdulEndde}
            >
              {submitting ? t('com.processing', '처리 중…') : t('com.save', '저장')}
            </button>
            <button type="button" className="krds-btn tertiary" onClick={() => navigate('/schedule')}>
              {t('com.cancel', '취소')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
