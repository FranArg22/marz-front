import { I18nProvider } from '@lingui/react'
import { useEffect, useState, createContext } from 'react'

import { LOCALE_STORAGE_KEY, isLocale } from './config'
import type { Locale } from './config'
import { activateCatalog, i18n, loadCatalog } from './setup'
import type { Messages } from './setup'
import { persistLocale } from './server'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<I18nContextValue | null>(null)

type AppI18nProviderProps = {
  initialLocale: Locale
  initialMessages: Messages
  children: React.ReactNode
}

export function AppI18nProvider({
  initialLocale,
  initialMessages,
  children,
}: AppI18nProviderProps) {
  // Activate synchronously during render so child components calling t``
  // never see an empty catalog. useState's initializer fires once but a
  // streaming SSR boundary can re-render the provider before children
  // hydrate, leaving them without a locale. Re-activating here is a no-op
  // when the catalog is already loaded.
  // On the client, setup.ts pre-activates an empty catalog under DEFAULT_LOCALE,
  // so a locale-only guard skips activation when initialLocale === DEFAULT_LOCALE,
  // leaving children with the empty catalog (hash IDs in production). Also
  // activate when the active catalog is empty so the real initialMessages load.
  if (
    i18n.locale !== initialLocale ||
    Object.keys(i18n.messages).length === 0
  ) {
    activateCatalog(initialLocale, initialMessages)
  }

  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocale(i18n.locale) ? i18n.locale : initialLocale,
  )

  useEffect(() => {
    if (i18n.locale !== locale) void loadCatalog(locale)
  }, [locale])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  function setLocale(next: Locale) {
    if (!isLocale(next) || next === locale) return
    setLocaleState(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {}
    void persistLocale({ data: next })
  }

  return (
    <LocaleContext value={{ locale, setLocale }}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </LocaleContext>
  )
}
