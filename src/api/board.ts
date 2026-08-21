import { api } from './client'
import type {
  BoardDetailResponse,
  BoardListResponse,
  BoardMaster,
  BoardMasterListResponse,
} from './types'

export interface BoardSearchParams {
  bbsId: string
  pageIndex?: number
  /** 검색 조건 — 0: 제목, 1: 내용, 2: 작성자 */
  searchCnd?: string
  searchWrd?: string
}

/** 게시물 등록/수정에 쓰는 입력값 */
export interface BoardInput {
  bbsId: string
  /** 제목 */
  nttSj: string
  /** 본문 */
  nttCn: string
  /** 기존 첨부 그룹 ID (수정 시) */
  atchFileId?: string
  files?: File[]
}

/** 답변 등록 입력값 — 부모 게시물의 정렬 정보를 함께 보내야 트리 순서가 유지된다 */
export interface BoardReplyInput extends BoardInput {
  nttId: number
  parnts: string
  sortOrdr: number
  replyLc: string
}

function toFormData(input: BoardInput | BoardReplyInput): FormData {
  const form = new FormData()
  form.append('bbsId', input.bbsId)
  form.append('nttSj', input.nttSj)
  form.append('nttCn', input.nttCn)
  form.append('atchFileId', input.atchFileId ?? '')

  if ('nttId' in input) {
    form.append('nttId', String(input.nttId))
    form.append('parnts', input.parnts)
    form.append('sortOrdr', String(input.sortOrdr))
    form.append('replyLc', input.replyLc)
  }

  // 서버는 MultipartHttpServletRequest 의 파일 맵 전체를 훑으므로 파트 이름은 자유롭다.
  // 여러 파일을 같은 이름으로 보내면 맵에서 하나만 남으므로 인덱스를 붙여 구분한다.
  input.files?.forEach((file, index) => form.append(`file_${index}`, file))

  return form
}

export const boardApi = {
  /** 게시물 목록 (비로그인도 조회 가능) */
  list: (params: BoardSearchParams) =>
    api.get<BoardListResponse>('/board', {
      bbsId: params.bbsId,
      pageIndex: params.pageIndex ?? 1,
      searchCnd: params.searchCnd,
      searchWrd: params.searchWrd,
    }),

  /** 게시물 상세 — 호출할 때마다 서버에서 조회수가 1 증가한다 */
  detail: (bbsId: string, nttId: number | string) =>
    api.get<BoardDetailResponse>(`/board/${encodeURIComponent(bbsId)}/${nttId}`),

  /** 게시판의 첨부 정책(첨부 가능 여부·개수) */
  fileAttachInfo: (bbsId: string) =>
    api.get<Pick<BoardMaster, 'fileAtchPosblAt' | 'posblAtchFileNumber' | 'posblAtchFileSize'>>(
      `/boardFileAtch/${encodeURIComponent(bbsId)}`,
    ),

  create: (input: BoardInput) => api.upload<unknown>('/board', toFormData(input), 'POST'),

  update: (nttId: number | string, input: BoardInput) =>
    api.upload<unknown>(`/board/${nttId}`, toFormData(input), 'PUT'),

  /** 답변 등록 */
  reply: (input: BoardReplyInput) => api.upload<unknown>('/boardReply', toFormData(input), 'POST'),

  /**
   * 게시물 삭제.
   * 서버는 실제로 지우지 않고 삭제 표시를 남긴다(작성자 본인 또는 관리자만 가능).
   */
  remove: (bbsId: string, nttId: number | string) =>
    api.patch<unknown>(`/board/${encodeURIComponent(bbsId)}/${nttId}`, { bbsId, nttId: Number(nttId) }),
}

/** 게시판 마스터 관리 (ROLE_ADMIN 전용) */
export const boardMasterApi = {
  list: (params: { pageIndex?: number; searchCnd?: string; searchWrd?: string } = {}) =>
    api.get<BoardMasterListResponse>('/bbsMaster', {
      pageIndex: params.pageIndex ?? 1,
      searchCnd: params.searchCnd,
      searchWrd: params.searchWrd,
    }),

  detail: (bbsId: string) => api.get<BoardMaster>(`/bbsMaster/${encodeURIComponent(bbsId)}`),

  create: (input: Partial<BoardMaster>) => api.post<unknown>('/bbsMaster', input as Record<string, unknown>),

  update: (bbsId: string, input: Partial<BoardMaster>) =>
    api.put<unknown>(`/bbsMaster/${encodeURIComponent(bbsId)}`, input as Record<string, unknown>),

  /** 사용 중지(논리 삭제) */
  remove: (bbsId: string) => api.patch<unknown>(`/bbsMaster/${encodeURIComponent(bbsId)}`, { bbsId }),
}
