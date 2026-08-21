import { api } from './client'
import type { CommonCode, MemberListItem, PaginationInfo } from './types'

interface MemberListResponse {
  resultList?: MemberListItem[]
  paginationInfo: PaginationInfo
  /** 권한 그룹 목록 — 검색 필터/등록 폼의 셀렉트에 쓴다 */
  groupId_result?: CommonCode[]
  [key: string]: unknown
}

export interface MemberSearchParams {
  pageIndex?: number
  /** 검색 조건 — 0: 이름, 1: 아이디 */
  searchCondition?: string
  searchKeyword?: string
  /** 상태 필터 */
  sbscrbSttus?: string
}

/** 마이페이지에서 수정 가능한 항목 */
export interface MyPageInput {
  mberNm?: string
  emailAdres?: string
  moblphonNo?: string
  areaNo?: string
  /** 새 비밀번호 — 변경하지 않으면 보내지 않는다 */
  password?: string
}

export const memberApi = {
  /** 회원 목록 (ROLE_ADMIN 전용) */
  list: (params: MemberSearchParams = {}) =>
    api.get<MemberListResponse>('/members', {
      pageIndex: params.pageIndex ?? 1,
      searchCondition: params.searchCondition,
      searchKeyword: params.searchKeyword,
      sbscrbSttus: params.sbscrbSttus,
    }),

  /** 회원 상세 (ROLE_ADMIN 전용) */
  detail: (uniqId: string) => api.get<MemberListItem>(`/members/update/${encodeURIComponent(uniqId)}`),

  update: (input: Record<string, unknown>) => api.put<unknown>('/members/update', input),

  remove: (uniqId: string) => api.delete<unknown>(`/members/delete/${encodeURIComponent(uniqId)}`),

  /** 내 정보 조회 (일반회원) */
  myPage: () => api.get<MemberListItem>('/mypage'),

  /** 내 정보 수정 */
  updateMyPage: (input: MyPageInput) => api.put<unknown>('/mypage/update', input as Record<string, unknown>),

  /** 회원 탈퇴 */
  withdraw: () => api.put<unknown>('/mypage/delete'),

  /** 아이디 중복 확인 — 사용 가능하면 true */
  checkId: (id: string) => api.get<{ usedCnt?: number } | number>(`/etc/member_checkid/${encodeURIComponent(id)}`),

  /** 이용약관 조회 (회원가입 1단계) */
  agreement: () => api.get<unknown>('/etc/member_agreement'),

  /** 회원가입 */
  register: (input: Record<string, unknown>) => api.post<unknown>('/etc/member_insert', input),
}
