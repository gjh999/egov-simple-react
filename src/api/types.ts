/**
 * 백엔드 응답에 실제로 담겨 오는 필드만 옮긴 타입 정의.
 *
 * 필드명은 eGovFrame 표준용어의 영문 약어를 그대로 쓴다(nttSj=게시물제목, frstRegisterNm=최초등록자명 등).
 * DB 컬럼명과 1:1로 대응하므로 임의로 바꾸지 않는다 — 이름을 바꾸면 서버 DTO 와 어긋난다.
 */

/** 서버가 계산해 주는 페이지네이션 정보 */
export interface PaginationInfo {
  currentPageNo: number
  recordCountPerPage: number
  pageSize: number
  totalRecordCount: number
  totalPageCount: number
  firstPageNoOnPageList: number
  lastPageNoOnPageList: number
  firstPageNo: number
  lastPageNo: number
}

/** 게시물 목록 항목 */
export interface BoardListItem {
  bbsId: string
  nttId: number
  /** 게시물 제목 */
  nttSj: string
  /** 조회 수 */
  inqireCo: number
  /** 최초등록자명 */
  frstRegisterNm: string
  /** 등록일 (yyyy-MM-dd) */
  frstRegisterPnttm: string
  /** 답변 깊이 — 들여쓰기 표시에 쓴다 */
  replyLc: string
  bbsUseFlag: string
}

/** 게시물 상세 */
export interface BoardDetail {
  bbsId: string
  nttId: number
  nttSj: string
  /** 본문 */
  nttCn: string
  inqireCo: number
  frstRegisterNm: string
  frstRegisterPnttm: string
  /** 작성자 고유 ID — 로그인 사용자의 uniqId 와 같으면 수정/삭제 가능 */
  frstRegisterId: string
  bbsNm: string
  replyPosblAt: string
  parnts: string
  replyLc?: string
  sortOrdr?: number
  /** 첨부파일 그룹 ID (없으면 빈 문자열) */
  atchFileId: string
}

/** 게시판 마스터(게시판 자체의 속성) */
export interface BoardMaster {
  bbsId: string
  bbsNm: string
  bbsIntrcn: string
  bbsTyCode: string
  bbsTyCodeNm: string
  bbsAttrbCode: string
  bbsAttrbCodeNm: string
  /** 첨부 가능 여부 Y/N */
  fileAtchPosblAt: string
  /** 첨부 가능 개수 */
  posblAtchFileNumber: number
  posblAtchFileSize: string
  /** 답변 가능 여부 Y/N */
  replyPosblAt: string
  useAt: string
  tmplatId?: string
  frstRegisterPnttm?: string
}

/** 첨부파일 */
export interface AttachedFile {
  atchFileId: string
  fileSn: string
  /** 원본 파일명 */
  orignlFileNm: string
  /** 파일 크기(byte) */
  fileMg: string
  fileExtsn?: string
}

/** 게시물 목록 응답 */
export interface BoardListResponse {
  resultList: BoardListItem[]
  resultCnt: number
  paginationInfo: PaginationInfo
  brdMstrVO: Pick<BoardMaster, 'fileAtchPosblAt' | 'posblAtchFileNumber' | 'posblAtchFileSize'> & Partial<BoardMaster>
}

/** 게시물 상세 응답 */
export interface BoardDetailResponse {
  boardVO: BoardDetail
  brdMstrVO: BoardMaster
  /** 첨부파일 목록 (첨부가 없으면 빈 배열) */
  fileList?: AttachedFile[]
  sessionUniqId?: string
}

/** 게시판 마스터 목록 응답 */
export interface BoardMasterListResponse {
  resultList: BoardMaster[]
  resultCnt: number
  paginationInfo: PaginationInfo
}

/** 공통코드 항목 (일정 구분 등) */
export interface CommonCode {
  code: string
  codeNm: string
  codeDc: string
}

/** 일정 */
export interface Schedule {
  schdulId: string
  /** 일정명 */
  schdulNm: string
  /** 일정내용 */
  schdulCn: string
  /** 일정구분 코드 (COM030) */
  schdulSe: string
  /** 시작일시 yyyyMMddHHmm */
  schdulBgnde: string
  /** 종료일시 yyyyMMddHHmm */
  schdulEndde: string
  /** 장소 */
  schdulPlace?: string
  /** 등록자 ID */
  frstRegisterId?: string
  atchFileId?: string
}

/** 회원 목록 항목 */
export interface MemberListItem {
  /** 회원 고유 ID */
  uniqId: string
  /** 사용자 ID */
  emplyrId?: string
  mberId?: string
  /** 사용자명 */
  userNm?: string
  mberNm?: string
  emailAdres?: string
  /** 사용자 상태 코드 (P: 정상 등) */
  emplyrSttusCode?: string
  mberSttus?: string
  groupId?: string
  sbscrbDe?: string
}

/** 메인 화면 응답 */
export interface MainPageResponse {
  notiList: BoardListItem[]
  galleryList?: BoardListItem[]
  scheduleList?: Schedule[]
}
