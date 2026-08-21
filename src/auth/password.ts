/**
 * 로그인 비밀번호 1차 해시.
 *
 * 이 시스템은 비밀번호를 **평문으로 전송하지 않는다**. 저장값은 이중 해시이고,
 * 클라이언트가 1차 해시를, 서버가 2차 해시를 담당한다.
 *
 *   클라이언트 전송값 = Base64( SHA-256( id바이트 ‖ password바이트 ) )
 *   서버 저장값       = Base64( SHA-256( id바이트 ‖ 클라이언트전송값바이트 ) )
 *
 * 서버의 `EgovFileScrty.encryptPassword(password, id)` 와 바이트 단위로 같은 계산이어야 한다
 * (MessageDigest 에 salt 로 id 를 update 한 뒤 password 를 digest).
 * 한 바이트라도 어긋나면 비밀번호가 맞아도 로그인에 실패한다.
 *
 * 주의: `crypto.subtle` 은 보안 컨텍스트(HTTPS 또는 localhost)에서만 제공된다.
 * 사설 IP 로 HTTP 접속하면 undefined 이므로, 운영 배포는 HTTPS 가 사실상 필수다.
 */
export async function hashPassword(id: string, plainPassword: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      '이 브라우저에서는 비밀번호를 안전하게 처리할 수 없습니다. HTTPS 로 접속했는지 확인해 주세요.',
    )
  }

  const encoder = new TextEncoder()
  const idBytes = encoder.encode(id)
  const passwordBytes = encoder.encode(plainPassword)

  // salt(id) 와 password 를 이어 붙인 바이트 열을 해시한다
  const message = new Uint8Array(idBytes.length + passwordBytes.length)
  message.set(idBytes, 0)
  message.set(passwordBytes, idBytes.length)

  const digest = await globalThis.crypto.subtle.digest('SHA-256', message)
  return toBase64(new Uint8Array(digest))
}

/** 바이트 배열을 Base64 문자열로 변환한다 (btoa 는 문자열만 받는다). */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}
