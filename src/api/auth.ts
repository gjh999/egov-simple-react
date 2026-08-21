import { api } from './client'
import { hashPassword } from '../auth/password'

/** 로그인한 사용자 정보 (서버가 화면 표시·권한 분기용으로만 내려주는 최소 집합) */
export interface CurrentUser {
  id: string
  name: string
  /** 사용자 구분 — USR(업무사용자) / ADM(관리자) / GNR(일반회원) 등 */
  userSe: string
  /** 게시물 작성자 본인 확인에 쓰는 고유 식별자 */
  uniqId: string
  roles: string[]
}

export const authApi = {
  /**
   * 로그인. 성공하면 서버가 ACCESS_TOKEN HttpOnly 쿠키를 심는다(응답 본문에 토큰은 없다).
   * 비밀번호는 여기서 1차 해시한 뒤 전송한다 — 평문이 네트워크에 나가지 않는다.
   */
  async login(id: string, password: string): Promise<Omit<CurrentUser, 'roles'>> {
    return api.post<Omit<CurrentUser, 'roles'>>('/auth/login-jwt', {
      id,
      password: await hashPassword(id, password),
      userSe: 'USR',
    })
  },

  /** 로그아웃 — 서버가 쿠키를 만료시킨다. */
  async logout(): Promise<void> {
    await api.get('/auth/logout')
  },

  /**
   * 현재 로그인 사용자 조회. 앱 시작 시 한 번 호출해 라우트 가드·메뉴 분기에 쓴다.
   * 비로그인 상태면 서버가 resultCode 401 을 담아 응답하므로 null 을 돌려준다.
   */
  async me(): Promise<CurrentUser | null> {
    try {
      return await api.get<CurrentUser>('/auth/me')
    } catch {
      // 미인증은 오류가 아니라 '로그인 안 된 상태'다 — 화면은 그대로 그려져야 한다
      return null
    }
  },
}
