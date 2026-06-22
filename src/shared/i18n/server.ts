import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  isLocale,
} from './config'
import type { Locale } from './config'

// We intentionally do NOT auto-detect the locale from the browser's
// Accept-Language header: the product is Spanish-first and the `en` catalog is
// still largely untranslated, so an English browser would otherwise land on a
// broken half-English UI. Only an explicit choice (persisted to the cookie via
// `persistLocale`) overrides the Spanish default.
export const resolveLocale = createServerFn({ method: 'GET' }).handler(() => {
  const cookieLocale = getCookie(LOCALE_COOKIE)
  if (isLocale(cookieLocale)) return cookieLocale

  return DEFAULT_LOCALE
})

export const persistLocale = createServerFn({ method: 'POST' })
  .inputValidator((value: unknown): Locale => {
    if (!isLocale(value)) {
      throw new Error(
        `Invalid locale. Expected one of: ${SUPPORTED_LOCALES.join(', ')}`,
      )
    }
    return value
  })
  .handler(({ data }) => {
    setCookie(LOCALE_COOKIE, data, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return { locale: data }
  })
