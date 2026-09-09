import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { errorMessage } from '../types'
import { API_ERROR_KEYS, STORAGE_KEY, messages } from '../i18n/messages'
import type { Locale, MessageKey } from '../i18n/messages'

type Vars = Record<string, string | number>

export type Translate = (key: MessageKey, vars?: Vars) => string

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
  te: (error: unknown) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh') return saved
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')) {
    return 'zh'
  }
  return 'en'
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] === undefined ? match : String(vars[name]),
  )
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback<Translate>(
    (key, vars) => interpolate(messages[locale][key], vars),
    [locale],
  )

  const te = useCallback(
    (error: unknown) => {
      const raw = errorMessage(error)
      const key = API_ERROR_KEYS[raw]
      if (key) return t(key)
      const shortMatch = raw.match(/Minimum length is (\d+) nt/)
      if (shortMatch) return t('seq.short', { min: shortMatch[1] })
      const longMatch = raw.match(/Maximum length is (\d+) nt/)
      if (longMatch) return t('seq.long', { max: longMatch[1] })
      return raw
    },
    [t],
  )

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.title = messages[locale]['meta.title']
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t, te }), [locale, setLocale, t, te])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleProvider')
  return value
}
