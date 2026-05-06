import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export type Locale = 'zh' | 'en'

type LocaleContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function parseLocaleFromSearch(search: string): Locale {
  const params = new URLSearchParams(search)
  const lang = params.get('lang')
  if (lang === 'en') return 'en'
  return 'zh'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const locale = useMemo(
    () => parseLocaleFromSearch(location.search),
    [location.search],
  )

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        const params = new URLSearchParams(location.search)
        params.set('lang', next)
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
      },
    }),
    [locale, location.pathname, location.search, navigate],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
