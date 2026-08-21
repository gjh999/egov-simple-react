import { api } from './client'
import type { BoardMaster, PaginationInfo } from './types'

/** 폼에서 올라온 값 — 문자열 맵을 그대로 서버로 보낸다 */
export type FormValues = Record<string, string>

/** 목록 응답의 공통 형태 (관리자 화면 골격이 기대하는 모양) */
export interface PagedResult<T> {
  resultList: T[]
  paginationInfo: PaginationInfo
}

/** 게시판 사용정보 — 어떤 대상이 어떤 게시판을 쓰는지의 연결 */
export interface BoardUseInfo {
  trgetId: string
  bbsId: string
  bbsNm?: string
  useAt?: string
  registSeCode?: string
}

/**
 * 게시판 마스터 관리 (ROLE_ADMIN 전용).
 *
 * 목록·상세는 `board.ts` 의 `boardMasterApi` 에도 있지만, 그쪽은 화면이 게시판 이름·첨부 정책을
 * 읽는 용도다. 여기는 관리자 화면 골격이 기대하는 `PagedResult` 형태로 감싸 준다.
 */
export const boardMasterAdminApi = {
  list: (pageIndex: number, keyword: string) =>
    api.get<PagedResult<BoardMaster> & { resultCnt: number }>('/bbsMaster', {
      pageIndex,
      searchCnd: keyword ? '0' : undefined,
      searchWrd: keyword || undefined,
    }),

  create: (values: FormValues) => api.post<unknown>('/bbsMaster', values),

  update: (bbsId: string, values: FormValues) =>
    api.put<unknown>(`/bbsMaster/${encodeURIComponent(bbsId)}`, values),

  /** 사용 중지(논리 삭제) — 쌓인 게시물은 남는다 */
  remove: (bbsId: string) => api.patch<unknown>(`/bbsMaster/${encodeURIComponent(bbsId)}`, { bbsId }),
}

/** 게시판 사용정보 관리 (ROLE_ADMIN 전용) */
export const boardUseAdminApi = {
  list: (pageIndex: number) => api.get<PagedResult<BoardUseInfo>>('/bbsUseInf', { pageIndex }),

  detail: (trgetId: string, bbsId: string) =>
    api.get<BoardUseInfo>(`/bbsUseInf/${encodeURIComponent(trgetId)}/${encodeURIComponent(bbsId)}`),

  /** 아직 사용정보가 등록되지 않은 게시판 목록 (등록 폼의 선택지) */
  notUsedBoards: () => api.get<{ resultList: BoardMaster[] }>('/notUsedBbsMaster'),

  create: (values: FormValues) => api.post<unknown>('/bbsUseInf', values),

  update: (bbsId: string, values: FormValues) =>
    api.put<unknown>(`/bbsUseInf/${encodeURIComponent(bbsId)}`, values),
}

/** 관리자 비밀번호 변경 */
export const siteAdminApi = {
  /**
   * 비밀번호 변경.
   *
   * ⚠️ **로그인과 달리 평문을 보낸다.** 서버가 `encryptPasswordTwice` 로 이중 해시를 직접 만들어
   * 저장값과 비교·저장하기 때문이다. 여기서 미리 해싱하면 서버가 그 값을 또 이중 해시해 어긋난다.
   * (로그인은 클라이언트가 1차 해시를 담당한다 — 같은 프로젝트 안에서 규칙이 다르니 주의.)
   *
   * 평문이 네트워크에 노출되지 않도록 운영 배포에는 HTTPS 가 필수다.
   */
  changePassword: (oldPassword: string, newPassword: string) =>
    api.patch<unknown>('/admin/password', { old_password: oldPassword, new_password: newPassword }),
}
