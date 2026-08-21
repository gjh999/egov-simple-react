import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { CurrentUser } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'

interface AuthState {
  user: CurrentUser | null
  /** 최초 사용자 조회가 끝나기 전에는 라우트 가드가 판단을 미뤄야 한다 */
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (id: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** 서버 상태와 다시 맞춘다 (권한 변경·다른 탭에서 로그아웃 등) */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setUser(await authApi.me())
  }, [])

  // 앱 시작 시 쿠키만 보고는 로그인 여부를 알 수 없다(HttpOnly 라 JS 가 읽지 못한다).
  // 서버에 물어보는 것이 유일한 방법이다.
  useEffect(() => {
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 어떤 API 든 401 을 받으면 토큰이 만료된 것이다 — 화면 상태를 즉시 로그아웃으로 되돌린다.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (id: string, password: string) => {
    await authApi.login(id, password)
    // 로그인 응답에는 roles 가 없다 — 권한까지 담긴 정보를 /auth/me 로 다시 받는다
    setUser(await authApi.me())
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      // 서버 호출이 실패해도 화면은 로그아웃 상태로 만든다
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      isAdmin: user?.roles?.includes('ROLE_ADMIN') ?? false,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
