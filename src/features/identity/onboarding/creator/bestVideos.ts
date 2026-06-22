/**
 * Normaliza un link de "mejor video": antepone https:// si el usuario lo pegó
 * sin protocolo (instagram.com/reel/x → https://instagram.com/reel/x) y deja
 * los vacíos como cadena vacía para poder filtrarlos.
 */
export function normalizeVideoUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Coincide con la validación zod.url() del payload (constructor URL). */
export function isValidVideoUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
