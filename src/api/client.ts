/**
 * 백엔드 REST API 호출 공통 계층.
 *
 * 계약 요약 (egov-simple-api 저장소 README.md 의 "API 규약" 절과 동일):
 * - 인증은 `ACCESS_TOKEN` HttpOnly 쿠키다. JS 가 토큰을 읽을 수 없으므로 저장·부착 로직이 없다.
 *   대신 모든 요청에 `credentials: 'include'` 가 필요하다.
 * - 응답은 두 가지 형태가 섞여 있다(백엔드의 점진적 리팩터링 흔적).
 *     A) { resultCode: 200, resultMessage, result: <데이터> }   ← IntermediateResultVO
 *     B) { resultCode: "200", resultMessage, resultVO: <데이터> } ← 로그인/일부 컨트롤러
 *   `unwrap()` 이 둘을 흡수해 데이터만 돌려준다. 화면 코드는 이 차이를 몰라도 된다.
 * - resultCode 는 HTTP 상태와 별개다. HTTP 200 이어도 resultCode 가 401/403/900 일 수 있다.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/** 서버가 돌려준 실패를 담는 오류. 화면에서 code 로 분기할 수 있다. */
export class ApiError extends Error {
  readonly code: number
  readonly httpStatus: number

  constructor(message: string, code: number, httpStatus: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
  }

  /** 인증이 필요하거나 만료된 상태 */
  get isUnauthorized(): boolean {
    return this.httpStatus === 401 || this.code === 401
  }

  /** 로그인은 됐지만 권한이 모자란 상태 */
  get isForbidden(): boolean {
    return this.httpStatus === 403 || this.code === 403
  }
}

/** 401 이 발생했을 때 앱 전체가 반응할 수 있도록 알리는 훅(AuthProvider 가 등록한다). */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

/** 현재 선택된 언어 — 서버 검증 메시지를 같은 언어로 받기 위해 Accept-Language 로 보낸다. */
let currentLang = 'ko'

export function setApiLanguage(lang: string): void {
  currentLang = lang
}

type Payload = Record<string, unknown>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** JSON 본문 */
  body?: Payload
  /** 폼(multipart) 본문 — 파일 첨부가 있는 요청에 사용 */
  formData?: FormData
  /** 쿼리 파라미터 (undefined·null·빈 문자열은 자동으로 제외된다) */
  params?: Record<string, string | number | undefined | null>
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = `${API_BASE}${path}`
  if (!params) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, String(value))
  }
  const query = search.toString()
  return query ? `${url}?${query}` : url
}

/**
 * 래핑된 응답에서 데이터만 꺼낸다.
 * resultCode 가 성공(200)이 아니면 ApiError 를 던진다.
 */
function unwrap<T>(json: unknown, httpStatus: number): T {
  if (json === null || typeof json !== 'object') {
    // 래핑되지 않은 원시 응답(예: 일부 조회 API)은 그대로 반환한다
    return json as T
  }

  const body = json as Record<string, unknown>
  if (!('resultCode' in body)) {
    return json as T
  }

  // resultCode 는 컨트롤러에 따라 number("200")/string(200) 이 섞여 있다
  const code = Number(body.resultCode)
  if (code !== 200) {
    const message = typeof body.resultMessage === 'string' ? body.resultMessage : '요청을 처리하지 못했습니다.'
    throw new ApiError(message, code, httpStatus)
  }

  // IntermediateResultVO 는 result, 구형 컨트롤러는 resultVO 에 데이터를 담는다
  if ('result' in body) return body.result as T
  if ('resultVO' in body) return body.resultVO as T
  return body as T
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, params } = options

  const headers: Record<string, string> = { 'Accept-Language': currentLang }
  // multipart 요청은 브라우저가 boundary 를 포함한 Content-Type 을 직접 붙여야 한다 —
  // 여기서 지정하면 boundary 가 빠져 서버가 파트를 파싱하지 못한다.
  if (body && !formData) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      credentials: 'include', // ACCESS_TOKEN 쿠키 전송 — 이 옵션이 없으면 모든 인증 요청이 401 이 된다
      body: formData ?? (body ? JSON.stringify(body) : undefined),
    })
  } catch {
    // 네트워크 단절·CORS 차단 등 — 서버 응답 자체가 없는 경우
    throw new ApiError('서버에 연결하지 못했습니다.', 0, 0)
  }

  if (response.status === 401) {
    onUnauthorized?.()
    throw new ApiError('로그인이 필요합니다.', 401, 401)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(`요청에 실패했습니다. (HTTP ${response.status})`, response.status, response.status)
    }
    // 파일 다운로드 등 JSON 이 아닌 응답은 호출부가 직접 다루도록 Response 를 넘긴다
    return response as unknown as T
  }

  const json = await response.json()

  if (!response.ok) {
    const message =
      typeof json?.resultMessage === 'string' ? json.resultMessage : `요청에 실패했습니다. (HTTP ${response.status})`
    throw new ApiError(message, Number(json?.resultCode ?? response.status), response.status)
  }

  return unwrap<T>(json, response.status)
}

export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: Payload) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: Payload) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: Payload) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, body?: Payload) => request<T>(path, { method: 'DELETE', body }),
  /** 파일 첨부가 포함된 요청 (게시물 등록/수정) */
  upload: <T>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') =>
    request<T>(path, { method, formData }),
  /** 첨부파일 다운로드 URL — <a href> 로 직접 사용한다(쿠키가 자동 전송된다) */
  fileUrl: (atchFileId: string, fileSn: string) =>
    `${API_BASE}/file?atchFileId=${encodeURIComponent(atchFileId)}&fileSn=${encodeURIComponent(fileSn)}`,
}
