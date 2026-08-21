import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** 같은 조건으로 다시 불러온다 (등록·삭제 후 목록 갱신 등) */
  reload: () => void
}

/**
 * 비동기 조회를 상태와 함께 다루는 훅.
 *
 * 화면마다 loading/error/데이터 세 상태를 손으로 관리하면 한 군데씩 빠뜨리게 된다.
 * `deps` 가 바뀌면 자동으로 다시 조회하고, 응답이 늦게 도착한 이전 요청은 버린다
 * (페이지를 빠르게 넘길 때 옛 결과가 뒤늦게 덮어쓰는 것을 막는다).
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setData(null)
        setError(e instanceof ApiError ? e.message : '데이터를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // fetcher 는 매 렌더마다 새로 만들어지므로 의존성에서 제외하고, 호출부가 준 deps 로만 재조회한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload }
}
