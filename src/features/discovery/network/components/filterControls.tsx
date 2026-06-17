import { Check } from 'lucide-react'
import { Checkbox } from 'radix-ui'
import type { ReactNode } from 'react'

import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'
import {
  GetDiscoveryCreatorsAgeBucketsItem,
  SocialPlatform,
} from '#/shared/api/generated/model'

/* eslint-disable lingui/no-unlocalized-strings -- brand names, static labels */
export const PLATFORM_OPTIONS = [
  { value: SocialPlatform.instagram, label: 'Instagram' },
  { value: SocialPlatform.tiktok, label: 'TikTok' },
  { value: SocialPlatform.youtube, label: 'YouTube' },
]
/* eslint-enable lingui/no-unlocalized-strings */

export const AGE_OPTIONS = [
  GetDiscoveryCreatorsAgeBucketsItem['18-24'],
  GetDiscoveryCreatorsAgeBucketsItem['25-34'],
  GetDiscoveryCreatorsAgeBucketsItem['35-44'],
  GetDiscoveryCreatorsAgeBucketsItem['45-54'],
  GetDiscoveryCreatorsAgeBucketsItem['55+'],
]

// Displayed as whole percentages; the API expects a 0..1 fraction (1% -> 0.01).
export const ENGAGEMENT_OPTIONS = [1, 3, 5]

export function FieldGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function PillGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

export function PillToggle({
  label,
  selected,
  disabled,
  onToggle,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        selected
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-background text-foreground hover:bg-surface-hover',
      )}
    >
      {label}
    </button>
  )
}

export function CheckboxOptionList<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: Array<{ value: T; label: string }>
  values: T[]
  onToggle: (value: T) => void
}) {
  const selectedSet = new Set(values)

  return (
    // Stop the wheel event before react-remove-scroll (Dialog/Popover scroll
    // lock) cancels it for content portaled outside the locked node.
    <div
      className="max-h-60 overflow-y-auto"
      onWheel={(event) => event.stopPropagation()}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
        >
          <Checkbox.Root
            checked={selectedSet.has(option.value)}
            onCheckedChange={() => onToggle(option.value)}
            className="flex size-4 items-center justify-center rounded border border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          >
            <Checkbox.Indicator>
              <Check className="size-3 text-primary-foreground" />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span className="truncate">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

export function MoneyInput({
  inputType,
  moneyPrefix,
  value,
  onChange,
  error,
  placeholder,
}: {
  inputType: 'number' | 'text'
  moneyPrefix?: boolean
  value?: number | string
  onChange: (value: string) => void
  error: boolean
  placeholder: string
}) {
  return (
    <div className="relative">
      {moneyPrefix ? (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
      ) : null}
      <Input
        type={inputType}
        min={inputType === 'number' ? 0 : undefined}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error}
        placeholder={placeholder}
        className={cn(moneyPrefix && 'pl-6')}
      />
    </div>
  )
}

export function isInvalidNumberRange(min?: number, max?: number): boolean {
  return min !== undefined && max !== undefined && min > max
}

export function isInvalidDecimalRange(min?: string, max?: string): boolean {
  if (!min || !max) {
    return false
  }

  const parsedMin = Number.parseFloat(min)
  const parsedMax = Number.parseFloat(max)

  return (
    !Number.isNaN(parsedMin) &&
    !Number.isNaN(parsedMax) &&
    parsedMin > parsedMax
  )
}
