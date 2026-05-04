import { i18n } from '@lingui/core'

import { DEFAULT_LOCALE, isLocale } from './config'
import type { Locale } from './config'

type Messages = Record<string, string>

// Activate an empty catalog at module init so any t`` call before the real
// catalog loads returns the source string instead of throwing the
// "translation function without setting a locale" error. The real catalog
// is loaded by AppI18nProvider / __root beforeLoad and replaces this.
if (!i18n.locale) {
  i18n.loadAndActivate({ locale: DEFAULT_LOCALE, messages: {} })
}

const loaders: Record<Locale, () => Promise<{ messages: Messages }>> = {
  es: () => import('./locales/es/messages.po'),
  en: () => import('./locales/en/messages.po'),
}

export async function loadCatalog(locale: Locale): Promise<Messages> {
  const target = isLocale(locale) ? locale : DEFAULT_LOCALE
  const loader = loaders[target]
  const { messages } = await loader()
  i18n.loadAndActivate({ locale: target, messages })
  return messages
}

export function activateCatalog(locale: Locale, messages: Messages): void {
  const target = isLocale(locale) ? locale : DEFAULT_LOCALE
  i18n.loadAndActivate({ locale: target, messages })
}

export type { Messages }

export { i18n }
