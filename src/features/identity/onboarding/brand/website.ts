/**
 * Normaliza la web de la marca: antepone https:// si el usuario la pegó sin
 * protocolo (mimarca.com → https://mimarca.com) y deja el vacío como cadena
 * vacía para poder tratarlo como "no ingresada".
 */
export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/**
 * Una web es válida solo si, ya normalizada, es http(s) y su host es un dominio
 * real con TLD (ej. mimarca.com / www.mimarca.com.ar). No alcanza con que el
 * constructor URL no falle: "asd" → "https://asd" parsea pero no es una web.
 */
export function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(url.hostname)
  } catch {
    return false
  }
}
