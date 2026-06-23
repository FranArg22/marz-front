/**
 * Normaliza un link de video: antepone https:// si el usuario lo pegó sin
 * protocolo (instagram.com/reel/x → https://instagram.com/reel/x) y deja los
 * vacíos como cadena vacía para poder filtrarlos.
 */
export function normalizeVideoUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export type VideoProvider = 'youtube' | 'tiktok' | 'instagram'

const YT_SHORT_RE = /^https?:\/\/(www\.)?youtube\.com\/shorts\/([\w-]{6,})/i
const TIKTOK_RE =
  /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/(@[\w.-]+\/video\/\d+|[\w-]{6,})/i
const IG_REEL_RE = /^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p)\/[\w-]+/i

/**
 * Detecta la plataforma de un link de video ya normalizado. Devuelve null si no
 * matchea un Reel de Instagram, un TikTok o un Short de YouTube válido.
 */
export function detectVideoProvider(value: string): VideoProvider | null {
  if (YT_SHORT_RE.test(value)) return 'youtube'
  if (TIKTOK_RE.test(value)) return 'tiktok'
  if (IG_REEL_RE.test(value)) return 'instagram'
  return null
}

/**
 * Un link es válido solo si apunta a un Reel de IG, un TikTok o un Short de YT
 * reconocible. No alcanza con ser una URL bien formada.
 */
export function isValidVideoUrl(value: string): boolean {
  return detectVideoProvider(value) !== null
}
