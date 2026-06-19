import { cn } from '#/lib/utils'

// Twemoji SVGs are bundled from the package (no runtime CDN). Limiting the glob
// to regional-indicator pairs (`1f1*-1f1*`) keeps it to country flags only.
const flagAssets = import.meta.glob<string>(
  '/node_modules/@discordapp/twemoji/dist/svg/1f1*-1f1*.svg',
  { query: '?url', import: 'default', eager: true },
)

function flagUrl(country: string): string | null {
  const code = country.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return null
  const base = 0x1f1e6
  const cp1 = (base + code.charCodeAt(0) - 65).toString(16)
  const cp2 = (base + code.charCodeAt(1) - 65).toString(16)
  return (
    flagAssets[
      `/node_modules/@discordapp/twemoji/dist/svg/${cp1}-${cp2}.svg`
    ] ?? null
  )
}

interface FlagProps {
  /** ISO 3166-1 alpha-2 country code, e.g. `AR`. */
  country: string
  className?: string
}

/** Twemoji country flag, rendered identically across OSes (Win/Mac/iOS/Android). */
export function Flag({ country, className }: FlagProps) {
  const url = flagUrl(country)
  if (!url) return null
  return (
    <img
      src={url}
      alt=""
      aria-hidden
      className={cn('inline-block h-[1em] w-auto align-[-0.12em]', className)}
    />
  )
}
