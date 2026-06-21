import type { BestVideo } from '#/shared/api/generated/model/bestVideo'
import type { CreatorChannel } from '#/shared/api/generated/model/creatorChannel'
import type { CreatorRateCard } from '#/shared/api/generated/model/creatorRateCard'

export type { BestVideo, CreatorChannel, CreatorRateCard }

const CreatorOnboardingPayloadGender = {
  male: 'male',
  female: 'female',
  non_binary: 'non_binary',
  prefer_not_say: 'prefer_not_say',
} as const

export type CreatorOnboardingPayloadGender =
  | (typeof CreatorOnboardingPayloadGender)[keyof typeof CreatorOnboardingPayloadGender]
  | null

const CreatorOnboardingPayloadExperienceLevel = {
  none: 'none',
  '1_to_5': '1_to_5',
  '6_to_20': '6_to_20',
  '20_plus_primary': '20_plus_primary',
} as const

export type CreatorOnboardingPayloadExperienceLevel =
  (typeof CreatorOnboardingPayloadExperienceLevel)[keyof typeof CreatorOnboardingPayloadExperienceLevel]

const CreatorOnboardingPayloadTier = {
  nano: 'nano',
  micro: 'micro',
  mid: 'mid',
  macro: 'macro',
} as const

export type CreatorOnboardingPayloadTier =
  (typeof CreatorOnboardingPayloadTier)[keyof typeof CreatorOnboardingPayloadTier]

export interface CreatorOnboardingPayload {
  handle: string
  display_name: string
  bio?: string | null
  niches: string[]
  content_types: string[]
  country: string
  city?: string | null
  avatar_s3_key: string
  birthday: string
  whatsapp_e164: string
  gender?: string | null
  experience_level: string
  channels: CreatorChannel[]
  best_videos: BestVideo[]
  referral_text?: string | null
  tier: string
  languages: string[]
  barter_preference?: boolean
}
