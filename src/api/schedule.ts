import { api } from './client'
import type { CommonCode, MainPageResponse, Schedule } from './types'

/**
 * 일정 조회 파라미터.
 *
 * 주의: `month` 는 **0-based** 다(1월=0, 8월=7). 서버가 java.util.Calendar 규약을 그대로 노출한다.
 * JavaScript 의 `Date#getMonth()` 와 같은 기준이므로 변환 없이 그대로 넘기면 된다.
 */
export interface ScheduleSearchParams {
  year: number
  /** 0-based 월 (Date#getMonth() 값) */
  month: number
  /** 일 — 일별/주별 조회에서만 사용 */
  date?: number
  searchCondition?: string
  searchKeyword?: string
}

interface ScheduleListResponse {
  /** 일정 구분 공통코드(COM030) — 화면의 셀렉트 박스에 쓴다 */
  schdulSe: CommonCode[]
  /** 조회 기간에 속한 일정 */
  resultList?: Schedule[]
  [key: string]: unknown
}

/** 일정 등록/수정 입력값 */
export interface ScheduleInput {
  schdulNm: string
  schdulCn: string
  /** 일정구분 코드 (COM030 의 code) */
  schdulSe: string
  /** yyyyMMddHHmm */
  schdulBgnde: string
  /** yyyyMMddHHmm */
  schdulEndde: string
  schdulPlace?: string
}

export const scheduleApi = {
  /** 월별 일정 */
  month: (params: ScheduleSearchParams) =>
    api.get<ScheduleListResponse>('/schedule/month', {
      year: params.year,
      month: params.month,
      searchCondition: params.searchCondition,
      searchKeyword: params.searchKeyword,
    }),

  /** 일별 일정 */
  daily: (params: ScheduleSearchParams) =>
    api.get<ScheduleListResponse>('/schedule/daily', {
      year: params.year,
      month: params.month,
      date: params.date,
      searchCondition: params.searchCondition,
      searchKeyword: params.searchKeyword,
    }),

  /** 주별 일정 */
  week: (params: ScheduleSearchParams) =>
    api.get<ScheduleListResponse>('/schedule/week', {
      year: params.year,
      month: params.month,
      date: params.date,
      searchCondition: params.searchCondition,
      searchKeyword: params.searchKeyword,
    }),

  detail: (schdulId: string) => api.get<{ result?: Schedule } & Schedule>(`/schedule/${encodeURIComponent(schdulId)}`),

  create: (input: ScheduleInput) => api.post<unknown>('/schedule', input as unknown as Record<string, unknown>),

  update: (schdulId: string, input: ScheduleInput) =>
    api.put<unknown>(`/schedule/${encodeURIComponent(schdulId)}`, input as unknown as Record<string, unknown>),

  remove: (schdulId: string) => api.delete<unknown>(`/schedule/${encodeURIComponent(schdulId)}`),
}

export const mainApi = {
  /** 메인 화면에 노출할 공지·갤러리·일정 요약 */
  summary: () => api.get<MainPageResponse>('/mainPage'),
}
