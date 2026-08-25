/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 REST API 의 기준 경로 (.env.development 참조) */
  readonly VITE_API_BASE: string
  /** SNS 간편 로그인 노출 여부 — 공급자 키를 백엔드에 넣은 뒤 'true' 로 바꾼다 */
  readonly VITE_SNS_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}