/* eslint-disable lingui/no-unlocalized-strings -- datos de muestra (ciudades,
   idiomas, tipos de contenido, URLs) que reemplaza el backend; no son copy de UI */
import type { DiscoveryCreatorPlatformStats } from '#/shared/api/generated/model'
import {
  CreatorOnboardingPayloadCreatorKindsItem,
  CreatorOnboardingPayloadExperienceLevel,
  CreatorOnboardingPayloadGender,
} from '#/shared/api/generated/model'

/**
 * Perfil completo de un creador para el sidesheet (cara marca).
 *
 * Hoy ninguna superficie expone este perfil completo: Explorar trae un
 * `DiscoveryCreatorCard` reducido y el chat solo trae `counterpart`
 * (id/nombre/avatar/handle). Marz ya guarda el resto en el onboarding del
 * creador, pero falta un endpoint brand-safe que lo exponga.
 *
 * `buildMockCreatorDetailProfile` arma el perfil combinando los campos reales
 * que tenga el origen con datos mockeados para el resto. Cuando el backend
 * agregue `GET /v1/discovery/creators/{creator_id}`, reemplazar este builder
 * por el fetch real es el único cambio: la UI ya consume esta forma.
 *
 * Datos de contacto (email, whatsapp, referral) quedan deliberadamente fuera:
 * este perfil es público para marcas.
 */
export interface CreatorDetailProfile {
  accountId: string
  creatorId: string
  displayName: string
  avatarUrl: string | null
  country: string
  age: number | null
  /** Intereses / niches declarados. */
  interests: string[]
  platforms: DiscoveryCreatorPlatformStats[]
  city: string | null
  gender: CreatorOnboardingPayloadGender
  creatorKinds: CreatorOnboardingPayloadCreatorKindsItem[]
  /** Tarifa UGC declarada. `null` si no hace UGC o no la cargó. Moneda en `ugcRateCurrency`. */
  ugcRateAmount: string | null
  ugcRateCurrency: string
  contentTypes: string[]
  languages: string[]
  /** URLs de los hasta 3 mejores videos del portfolio. */
  bestVideoUrls: string[]
  experienceLevel: CreatorOnboardingPayloadExperienceLevel | null
  acceptsCollaborations: boolean | null
}

/**
 * Origen del perfil. Las superficies pasan lo que tienen: Explorar incluye los
 * campos reales (country, age, interests, platforms); el chat solo pasa la
 * identidad y el resto se mockea.
 */
export interface CreatorProfileSource {
  creatorId: string
  accountId: string
  displayName: string
  avatarUrl: string | null
  handle?: string | null
  country?: string
  age?: number
  interests?: string[]
  platforms?: DiscoveryCreatorPlatformStats[]
}

// ---------------------------------------------------------------------------
// Mock determinista por creador. BORRAR junto con esta carpeta cuando el
// backend exponga el endpoint de detalle. Ver ticket de backend.
// ---------------------------------------------------------------------------

const MOCK_COUNTRIES = ['AR', 'MX', 'CO', 'CL', 'ES']

const MOCK_CITIES: (string | null)[] = [
  'Buenos Aires',
  'Córdoba',
  'Rosario',
  'Mendoza',
  null,
]

const MOCK_INTERESTS = [
  'Moda',
  'Fitness',
  'Belleza',
  'Tecnología',
  'Viajes',
  'Gastronomía',
]

const MOCK_GENDERS: CreatorOnboardingPayloadGender[] = [
  CreatorOnboardingPayloadGender.female,
  CreatorOnboardingPayloadGender.male,
  CreatorOnboardingPayloadGender.non_binary,
]

const MOCK_KINDS: CreatorOnboardingPayloadCreatorKindsItem[][] = [
  [CreatorOnboardingPayloadCreatorKindsItem.influencer],
  [CreatorOnboardingPayloadCreatorKindsItem.ugc],
  [
    CreatorOnboardingPayloadCreatorKindsItem.influencer,
    CreatorOnboardingPayloadCreatorKindsItem.ugc,
  ],
]

const MOCK_CONTENT_TYPES = [
  'Reels',
  'UGC',
  'Unboxing',
  'Tutoriales',
  'Vlogs',
  'Reseñas',
]

const MOCK_LANGUAGES = ['Español', 'Inglés', 'Portugués']

const MOCK_EXPERIENCE: CreatorOnboardingPayloadExperienceLevel[] = [
  CreatorOnboardingPayloadExperienceLevel.none,
  CreatorOnboardingPayloadExperienceLevel['1_to_5'],
  CreatorOnboardingPayloadExperienceLevel['6_to_20'],
  CreatorOnboardingPayloadExperienceLevel['20_plus_primary'],
]

const MOCK_VIDEO_POOL = [
  'https://www.tiktok.com/@creator/video/7300000000000000001',
  'https://www.instagram.com/reel/Cx0000000000/',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
]

const MOCK_UGC_RATES = ['80', '120', '150', '200']

const MOCK_PLATFORM_TEMPLATES: Omit<DiscoveryCreatorPlatformStats, 'handle'>[] =
  [
    {
      platform: 'instagram',
      followers: 45000,
      engagement_rate: 0.034,
      cpm_amount: '6',
      cpm_currency: 'USD',
      min_price_amount: '250',
      price_currency: 'USD',
    },
    {
      platform: 'tiktok',
      followers: 88000,
      engagement_rate: 0.051,
      cpm_amount: '4',
      cpm_currency: 'USD',
      min_price_amount: '320',
      price_currency: 'USD',
    },
    {
      platform: 'youtube',
      followers: 12000,
      engagement_rate: 0.028,
      cpm_amount: '9',
      cpm_currency: 'USD',
      min_price_amount: '500',
      price_currency: 'USD',
    },
  ]

/** Hash estable y chico a partir del id, para variar el mock por creador. */
function seedFrom(id: string): number {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) {
    sum = (sum + id.charCodeAt(i)) % 997
  }
  return sum
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length] as T
}

function buildMockPlatforms(
  handle: string | null | undefined,
  seed: number,
): DiscoveryCreatorPlatformStats[] {
  const count = 1 + (seed % MOCK_PLATFORM_TEMPLATES.length)
  const normalizedHandle = (handle ?? 'creator').replace(/^@/, '')
  return MOCK_PLATFORM_TEMPLATES.slice(0, count).map((template) => ({
    ...template,
    handle: normalizedHandle,
  }))
}

/**
 * Construye el perfil combinando lo real del origen con datos mockeados.
 * Reemplazar por el fetch al endpoint brand-safe cuando exista.
 */
export function buildMockCreatorDetailProfile(
  source: CreatorProfileSource,
): CreatorDetailProfile {
  const seed = seedFrom(source.creatorId || source.accountId)
  const kinds = pick(MOCK_KINDS, seed)
  const isUgc = kinds.includes(CreatorOnboardingPayloadCreatorKindsItem.ugc)
  const contentCount = 2 + (seed % 3)

  return {
    accountId: source.accountId,
    creatorId: source.creatorId,
    displayName: source.displayName,
    avatarUrl: source.avatarUrl,
    country: source.country ?? pick(MOCK_COUNTRIES, seed),
    age: source.age ?? 20 + (seed % 25),
    interests:
      source.interests && source.interests.length > 0
        ? source.interests
        : MOCK_INTERESTS.slice(0, 2 + (seed % 3)),
    platforms:
      source.platforms && source.platforms.length > 0
        ? source.platforms
        : buildMockPlatforms(source.handle, seed),

    city: pick(MOCK_CITIES, seed, 1),
    gender: pick(MOCK_GENDERS, seed),
    creatorKinds: kinds,
    ugcRateAmount: isUgc ? pick(MOCK_UGC_RATES, seed) : null,
    ugcRateCurrency: 'USD',
    contentTypes: MOCK_CONTENT_TYPES.slice(0, contentCount),
    languages: MOCK_LANGUAGES.slice(0, 1 + (seed % 2)),
    bestVideoUrls: MOCK_VIDEO_POOL.slice(0, 1 + (seed % 3)),
    experienceLevel: pick(MOCK_EXPERIENCE, seed),
    acceptsCollaborations: seed % 4 !== 0,
  }
}
