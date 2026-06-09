import { t } from '@lingui/core/macro'

/**
 * Single source of truth for the creator taxonomy (niches and content types).
 *
 * Used both by the creator onboarding screens (C5, C6) and by the discovery
 * filter panel so the available options stay in sync. Labels are i18n thunks
 * (`() => string`) so callers resolve them at render time.
 *
 * Icons intentionally live only where they are needed (C6 onboarding screen),
 * not here, since the discovery filter does not render icons.
 */

export interface CatalogOption {
  value: string
  label: () => string
}

export const NICHE_OPTIONS: CatalogOption[] = [
  { value: 'fintech', label: () => t`Fintech` },
  { value: 'tech', label: () => t`Tech` },
  { value: 'gaming', label: () => t`Gaming` },
  { value: 'comedy', label: () => t`Comedy` },
  { value: 'lifestyle', label: () => t`Lifestyle` },
  { value: 'business', label: () => t`Business` },
  { value: 'productivity', label: () => t`Productividad` },
  { value: 'fitness', label: () => t`Fitness` },
  { value: 'personal_finance', label: () => t`Finanzas personales` },
  { value: 'crypto', label: () => t`Crypto` },
  { value: 'food', label: () => t`Food` },
  { value: 'travel', label: () => t`Travel` },
  { value: 'beauty', label: () => t`Beauty` },
  { value: 'fashion', label: () => t`Moda` },
  { value: 'parenting', label: () => t`Parenting` },
]

export const CONTENT_TYPE_OPTIONS: CatalogOption[] = [
  { value: 'unboxing', label: () => t`Unboxing` },
  { value: 'reviews', label: () => t`Reviews` },
  { value: 'product_demos', label: () => t`Product demos` },
  { value: 'lifestyle', label: () => t`Lifestyle` },
  { value: 'storytelling', label: () => t`Storytelling` },
  { value: 'video_ads', label: () => t`Video Ads` },
  { value: 'faceless_clipping', label: () => t`Faceless / Clipping` },
  { value: 'tutorials', label: () => t`Tutoriales` },
  { value: 'interviews', label: () => t`Entrevistas` },
  { value: 'humor_sketches', label: () => t`Humor / Sketches` },
  { value: 'day_in_the_life', label: () => t`Day in the life` },
  { value: 'behind_the_scenes', label: () => t`Behind the scenes` },
]
