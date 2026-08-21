/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 REST API 의 기준 경로 (.env.development 참조) */
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
