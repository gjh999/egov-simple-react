import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface Props {
  children: ReactNode
  /** true 면 ROLE_ADMIN 인 사용자만 통과시킨다 */
  adminOnly?: boolean
}

/**
 * 라우트 가드.
 *
 * 서버 권한 검사를 대신하는 장치가 아니다 — 백엔드가 모든 요청을 다시 검사한다.
 * 이 가드는 권한 없는 화면을 그렸다가 401/403 을 받고 깨지는 것을 막는 UX 장치다.
 */
export function RequireAuth({ children, adminOnly = false }: Props) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  // 최초 /auth/me 응답 전에는 판단을 미룬다.
  // (여기서 곧바로 로그인 화면으로 보내면 새로고침할 때마다 로그인 화면이 깜빡인다)
  if (loading) {
    return (
      <div className="container-fluid py-5 text-center" role="status" aria-live="polite">
        <span>확인 중…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 위치를 남긴다
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
