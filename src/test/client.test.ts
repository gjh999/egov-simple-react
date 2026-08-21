import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, setUnauthorizedHandler } from '../api/client'

/** fetch 를 가짜 응답으로 바꾼다 */
function mockFetch(body: unknown, init: { status?: number; contentType?: string } = {}) {
  const { status = 200, contentType = 'application/json' } = init
  const spy = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': contentType }),
    json: async () => body,
  })
  globalThis.fetch = spy as unknown as typeof fetch
  return spy
}

afterEach(() => {
  vi.restoreAllMocks()
  setUnauthorizedHandler(null)
})

describe('api client', () => {
  it('IntermediateResultVO 형태({result})에서 데이터만 꺼낸다', async () => {
    mockFetch({ resultCode: 200, resultMessage: '성공했습니다.', result: { resultCnt: 3 } })
    await expect(api.get('/board')).resolves.toEqual({ resultCnt: 3 })
  })

  it('구형 컨트롤러 형태({resultVO})에서도 데이터만 꺼낸다', async () => {
    mockFetch({ resultCode: '200', resultMessage: '성공 !!!', resultVO: { id: 'admin' } })
    await expect(api.post('/auth/login-jwt')).resolves.toEqual({ id: 'admin' })
  })

  it('resultCode 가 200 이 아니면 서버 메시지를 담아 ApiError 를 던진다', async () => {
    mockFetch({ resultCode: 900, resultMessage: '입력값 무결성 오류 입니다.' })
    await expect(api.post('/board')).rejects.toMatchObject({
      name: 'ApiError',
      code: 900,
      message: '입력값 무결성 오류 입니다.',
    })
  })

  it('모든 요청에 쿠키를 실어 보낸다 (credentials: include)', async () => {
    const spy = mockFetch({ resultCode: 200, result: null })
    await api.get('/auth/me')
    expect(spy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ credentials: 'include' }))
  })

  it('HTTP 401 이면 등록된 핸들러를 부르고 ApiError 를 던진다', async () => {
    mockFetch({ resultCode: 401 }, { status: 401 })
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    await expect(api.get('/mypage')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('빈 값인 쿼리 파라미터는 URL 에서 제외한다', async () => {
    const spy = mockFetch({ resultCode: 200, result: [] })
    await api.get('/board', { bbsId: 'BBS_1', searchWrd: '', pageIndex: 2, searchCnd: undefined })

    const calledUrl = spy.mock.calls[0][0] as string
    expect(calledUrl).toContain('bbsId=BBS_1')
    expect(calledUrl).toContain('pageIndex=2')
    expect(calledUrl).not.toContain('searchWrd')
    expect(calledUrl).not.toContain('searchCnd')
  })

  it('네트워크가 끊기면 코드 0 의 ApiError 로 바꾼다', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch
    await expect(api.get('/board')).rejects.toMatchObject({ name: 'ApiError', code: 0 })
  })
})
