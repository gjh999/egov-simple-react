import { describe, expect, it } from 'vitest'
import { hashPassword } from '../auth/password'

/**
 * 서버(`EgovFileScrty.encryptPassword`)와 바이트 단위로 같은 값을 만들어야 한다.
 *
 * 기대값은 서버 구현으로 직접 계산한 것이다:
 *   MessageDigest md = MessageDigest.getInstance("SHA-256");
 *   md.update("admin".getBytes());
 *   Base64.encodeBase64(md.digest("1".getBytes()))
 *
 * 이 값이 어긋나면 비밀번호가 맞아도 로그인에 실패한다 — 회귀를 잡기 위한 고정 기대값이다.
 */
describe('hashPassword', () => {
  it('서버의 1차 해시(Base64(SHA-256(id ‖ password)))와 같은 값을 만든다', async () => {
    const hashed = await hashPassword('admin', '1')
    expect(hashed).toBe('JfQ7FIatlaE5jj7rPYO8QBABX8yb7bNbQy4AKY1QIfc=')
  })

  it('서버가 한 번 더 해싱한 값이 DB 저장값과 일치한다 (이중 해시 계약)', async () => {
    // 서버: encryptPassword(클라이언트해시, id) → DB 의 admin 계정 PASSWORD 컬럼 값
    const clientHash = await hashPassword('admin', '1')
    const serverHash = await hashPassword('admin', clientHash)
    expect(serverHash).toBe('Igeuuo4cojVU07mlpQKvrnEvq+5YsCN7YChFXwDKG7M=')
  })

  it('아이디가 salt 로 쓰이므로 같은 비밀번호라도 아이디가 다르면 다른 값이 된다', async () => {
    const forAdmin = await hashPassword('admin', 'same-password')
    const forUser = await hashPassword('user', 'same-password')
    expect(forAdmin).not.toBe(forUser)
  })

  it('Base64 문자열을 돌려준다 (SHA-256 32바이트 → 44자)', async () => {
    const hashed = await hashPassword('admin', '1')
    expect(hashed).toMatch(/^[A-Za-z0-9+/]{43}=$/)
  })
})
