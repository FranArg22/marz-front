import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STEPS } from './steps'
import type { CreatorOnboardingPayload } from './types'
import type { CreatorProfile } from '#/shared/api/generated/model/creatorProfile'

const LEGACY_STORAGE_KEY = 'marz-creator-onboarding'
const STORAGE_KEY = 'marz-creator-onboarding:v1'

const sessionStorageSSR = createJSONStorage<CreatorOnboardingState>(() => {
  if (typeof window === 'undefined') {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
  const purgeLegacy = () => sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  return {
    getItem: (key: string) => {
      purgeLegacy()
      return sessionStorage.getItem(key)
    },
    setItem: (key: string, value: string) => {
      purgeLegacy()
      sessionStorage.setItem(key, value)
    },
    removeItem: (key: string) => {
      purgeLegacy()
      sessionStorage.removeItem(key)
    },
  }
})

export type FieldErrors = Partial<
  Record<keyof CreatorOnboardingPayload, string>
>

export type CreatorOnboardingState = Partial<CreatorOnboardingPayload> & {
  currentStepIndex: number
  fieldErrors: FieldErrors
  prefilled?: boolean
  setField: <TKey extends keyof CreatorOnboardingPayload>(
    key: TKey,
    value: CreatorOnboardingPayload[TKey],
  ) => void
  setFieldErrors: (errors: FieldErrors) => void
  clearFieldErrors: () => void
  prefillFrom: (profile: CreatorProfile) => void
  goTo: (index: number) => void
  reset: () => void
}

export const useCreatorOnboardingStore = create<CreatorOnboardingState>()(
  persist(
    (set) => ({
      currentStepIndex: 0,
      fieldErrors: {},
      setField: (key, value) =>
        set((state) => ({
          [key]: value,
          fieldErrors: { ...state.fieldErrors, [key]: undefined },
        })),
      setFieldErrors: (errors: FieldErrors) => set({ fieldErrors: errors }),
      clearFieldErrors: () => set({ fieldErrors: {} }),
      prefillFrom: (profile: CreatorProfile) =>
        set((state) => {
          // Preloaded creators land here with a profile already attached; seed
          // the form once with what we have so they only fill the gaps. The
          // flag keeps later edits and reloads from being overwritten. Avatar
          // is intentionally skipped: onboarding requires a fresh upload under
          // its own key prefix.
          if (state.prefilled) return {}
          const next: Partial<CreatorOnboardingState> = { prefilled: true }
          if (profile.handle != null) next.handle = profile.handle
          if (profile.display_name != null)
            next.display_name = profile.display_name
          if (profile.bio != null) next.bio = profile.bio
          if (profile.niches != null) next.niches = profile.niches
          if (profile.content_types != null)
            next.content_types = profile.content_types
          if (profile.languages != null) next.languages = profile.languages
          if (profile.barter_preference != null)
            next.barter_preference = profile.barter_preference
          if (profile.country != null) next.country = profile.country
          if (profile.city != null) next.city = profile.city
          if (profile.experience_level != null)
            next.experience_level = profile.experience_level
          if (profile.gender != null) next.gender = profile.gender
          if (profile.birthday != null) next.birthday = profile.birthday
          if (profile.whatsapp_e164 != null)
            next.whatsapp_e164 = profile.whatsapp_e164
          if (profile.referral_text != null)
            next.referral_text = profile.referral_text
          if (profile.tier != null) next.tier = profile.tier
          return next
        }),
      goTo: (index: number) =>
        set({
          currentStepIndex: Math.min(Math.max(0, index), STEPS.length - 1),
        }),
      reset: () => {
        set({
          currentStepIndex: 0,
          fieldErrors: {},
          prefilled: undefined,
          handle: undefined,
          display_name: undefined,
          bio: undefined,
          niches: undefined,
          content_types: undefined,
          country: undefined,
          city: undefined,
          avatar_s3_key: undefined,
          birthday: undefined,
          whatsapp_e164: undefined,
          gender: undefined,
          experience_level: undefined,
          channels: undefined,
          best_videos: undefined,
          referral_text: undefined,
          tier: undefined,
          languages: undefined,
          barter_preference: undefined,
          creator_kinds: undefined,
          ugc_rate_amount: undefined,
        })
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY)
          sessionStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: sessionStorageSSR,
      skipHydration: true,
    },
  ),
)
