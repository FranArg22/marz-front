import { useCallback } from 'react'
import type { ComponentType } from 'react'
import { t } from '@lingui/core/macro'
import { Instagram, Users, Search, Linkedin } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
import { useBrandOnboardingStore } from '../store'
import { AttributionNonReferralSource } from '../types'
import type { Attribution } from '../types'

type SourceIcon = ComponentType<{ className?: string }>

type AllSource = AttributionNonReferralSource | 'referral'

// lucide-react no incluye glifos de marca de TikTok ni Reddit; los definimos inline.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  )
}

interface SourceOption {
  value: AllSource
  label: () => string
  icon?: SourceIcon
}

// Primer renglón: el resto (búsqueda, referido, otro).
const PRIMARY_SOURCES: SourceOption[] = [
  {
    value: AttributionNonReferralSource.search,
    label: () => t`Búsqueda en Google o IA`,
    icon: Search,
  },
  { value: 'referral' as const, label: () => t`Referido`, icon: Users },
  { value: AttributionNonReferralSource.other, label: () => t`Otro` },
]

// Segundo renglón: redes sociales.
const SOCIAL_SOURCES: SourceOption[] = [
  {
    value: AttributionNonReferralSource.instagram,
    label: () => t`Instagram`,
    icon: Instagram,
  },
  {
    value: AttributionNonReferralSource.tiktok,
    label: () => t`TikTok`,
    icon: TikTokIcon,
  },
  {
    value: AttributionNonReferralSource.linkedin,
    label: () => t`LinkedIn`,
    icon: Linkedin,
  },
  {
    value: AttributionNonReferralSource.reddit,
    label: () => t`Reddit`,
    icon: RedditIcon,
  },
]

function getSelectedSource(attr: Attribution | undefined): AllSource | null {
  if (!attr || !('source' in attr)) return null
  return attr.source
}

export function B11AttributionScreen() {
  const store = useBrandOnboardingStore()
  const selectedSource = getSelectedSource(store.attribution)
  const isReferral = selectedSource === 'referral'
  const referralText =
    store.attribution && 'referral_text' in store.attribution
      ? store.attribution.referral_text
      : ''

  const handleSelect = useCallback(
    (source: AllSource) => {
      if (source === 'referral') {
        store.setField('attribution', {
          source: 'referral',
          referral_text: referralText,
        })
      } else {
        store.setField('attribution', { source })
      }
    },
    [store, referralText],
  )

  const handleReferralTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('attribution', {
        source: 'referral',
        referral_text: e.target.value,
      })
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Cómo llegaste a Marz?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Nos ayuda a entender qué funciona.`}
        </p>
      </div>

      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div
          className="flex flex-col items-center gap-2.5"
          role="radiogroup"
          aria-label={t`Fuente`}
        >
          <div className="flex flex-wrap justify-center gap-2.5">
            {PRIMARY_SOURCES.map((s) => (
              <SourceChip
                key={s.value}
                option={s}
                selected={selectedSource === s.value}
                onSelect={handleSelect}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {SOCIAL_SOURCES.map((s) => (
              <SourceChip
                key={s.value}
                option={s}
                selected={selectedSource === s.value}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {isReferral && (
          <FieldRow label={t`¿Quién te recomendó Marz?`}>
            {(aria) => (
              <Input
                {...aria}
                value={referralText}
                onChange={handleReferralTextChange}
                placeholder={t`Nombre o handle de quien te pasó el dato`}
                maxLength={2000}
              />
            )}
          </FieldRow>
        )}
      </div>
    </div>
  )
}

function SourceChip({
  option,
  selected,
  onSelect,
}: {
  option: SourceOption
  selected: boolean
  onSelect: (source: AllSource) => void
}) {
  const Icon = option.icon
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(option.value)}
      className={cn(
        'flex h-11 items-center gap-2 rounded-full px-5 text-xs transition-colors',
        selected
          ? 'border-2 border-primary bg-primary/10 font-semibold text-primary'
          : 'border border-border bg-card font-medium text-foreground hover:bg-surface-hover',
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'size-4',
            selected ? 'text-primary' : 'text-foreground',
          )}
        />
      )}
      {option.label()}
    </button>
  )
}
