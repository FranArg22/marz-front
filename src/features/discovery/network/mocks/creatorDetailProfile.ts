/* eslint-disable lingui/no-unlocalized-strings -- datos de muestra (ciudades,
   idiomas, tipos de contenido, URLs) que reemplaza el backend; no son copy de UI */
import type {
  DiscoveryCreatorCard,
  DiscoveryCreatorPlatformStats,
} from '#/shared/api/generated/model'
import {
  CreatorOnboardingPayloadCreatorKindsItem,
  CreatorOnboardingPayloadExperienceLevel,
  CreatorOnboardingPayloadGender,
} from '#/shared/api/generated/model'

/**
 * Perfil completo de un creador para el sidesheet de Explorar (cara marca).
 *
 * El endpoint de discovery (`GET /v1/discovery/creators`) solo devuelve un
 * `DiscoveryCreatorCard` reducido. Marz ya guarda el resto en el onboarding del
 * creador, pero todavía no existe un endpoint brand-safe que lo exponga.
 *
 * Los campos marcados como `// PENDIENTE BACKEND` están mockeados en
 * `buildMockCreatorDetailProfile` hasta que el backend agregue
 * `GET /v1/discovery/creators/{creator_id}`. Cuando llegue, reemplazar el
 * builder por el fetch real es el único cambio: la UI ya consume esta forma.
 *
 * Datos de contacto (email, whatsapp, referral) quedan deliberadamente fuera:
 * este perfil es público para marcas.
 */
export interface CreatorDetailProfile {
  // --- Reales, ya disponibles en DiscoveryCreatorCard ---
  accountId: string
  creatorId: string
  displayName: string
  avatarUrl: string
  country: string
  age: number
  /** Intereses / niches declarados (hoy llegan como `card.tags`). */
  interests: string[]
  platforms: DiscoveryCreatorPlatformStats[]

  // --- PENDIENTE BACKEND (mockeado) ---
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

// ---------------------------------------------------------------------------
// Mock determinista por creador. BORRAR junto con esta carpeta cuando el
// backend exponga el endpoint de detalle. Ver ticket de backend.
// ---------------------------------------------------------------------------

const MOCK_CITIES: (string | null)[] = [
  'Buenos Aires',
  'Córdoba',
  'Rosario',
  'Mendoza',
  null,
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

/**
 * Construye el perfil completo combinando lo real del card con datos mockeados.
 * Reemplazar por el fetch al endpoint brand-safe cuando exista.
 */
export function buildMockCreatorDetailProfile(
  card: DiscoveryCreatorCard,
): CreatorDetailProfile {
  const seed = seedFrom(card.creator_id || card.account_id)
  const kinds = pick(MOCK_KINDS, seed)
  const isUgc = kinds.includes(CreatorOnboardingPayloadCreatorKindsItem.ugc)
  const contentCount = 2 + (seed % 3)

  return {
    accountId: card.account_id,
    creatorId: card.creator_id,
    displayName: card.display_name,
    avatarUrl: card.avatar_url,
    country: card.country,
    age: card.age,
    interests: card.tags,
    platforms: card.platforms,

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
