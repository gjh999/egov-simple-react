import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, setApiLanguage } from '../api/client'

export type Lang = 'ko' | 'en'

const STORAGE_KEY = 'egov-simple.lang'

interface I18nState {
  lang: Lang
  setLang: (lang: Lang) => void
  /** 메시지 키를 현재 언어의 문구로 바꾼다. 키가 없으면 fallback(없으면 키 자체)을 돌려준다. */
  t: (key: string, fallback?: string) => string
  ready: boolean
}

const I18nContext = createContext<I18nState | null>(null)

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ko' || stored === 'en') return stored
  } catch {
    // 사생활 보호 모드 등에서 localStorage 접근이 막힐 수 있다 — 기본값으로 진행한다
  }
  return 'ko'
}

/**
 * 다국어 제공자.
 *
 * 문구의 원본은 백엔드의 properties 한 벌이다(`GET /api/i18n/{lang}`).
 * React 와 Vue 프론트가 같은 번들을 받아 쓰므로 두 화면의 문구가 갈라지지 않는다.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setApiLanguage(lang)
    document.documentElement.lang = lang

    api
      .get<Record<string, string>>(`/i18n/${lang}`)
      .then((bundle) => {
        if (!cancelled) setMessages(bundle ?? {})
      })
      .catch(() => {
        // 번들을 못 받아도 화면은 떠야 한다 — t() 가 fallback 문구를 쓴다
        if (!cancelled) setMessages({})
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 저장 실패는 무시한다 — 이번 세션 동안은 선택이 유지된다
    }
  }, [])

  const t = useCallback(
    (key: string, fallback?: string) => messages[key] ?? fallback ?? key,
    [messages],
  )

  const value = useMemo<I18nState>(() => ({ lang, setLang, t, ready }), [lang, setLang, t, ready])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nState {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n 은 I18nProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
