import { useCallback, useEffect, useMemo, useState } from 'react'
import { t } from '@lingui/core/macro'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { FieldRow } from '#/shared/ui/form'
import { useCreatorOnboardingStore } from '../store'
import { isAtLeast18 } from '../steps'

const MONTHS = () => [
  t`Enero`,
  t`Febrero`,
  t`Marzo`,
  t`Abril`,
  t`Mayo`,
  t`Junio`,
  t`Julio`,
  t`Agosto`,
  t`Septiembre`,
  t`Octubre`,
  t`Noviembre`,
  t`Diciembre`,
]

function parseBirthday(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return { year: '', month: '', day: '' }
  return {
    year: match[1],
    month: String(Number(match[2])),
    day: String(Number(match[3])),
  }
}

export function C11BirthdayScreen() {
  const birthday = useCreatorOnboardingStore((s) => s.birthday)
  const birthdayError = useCreatorOnboardingStore((s) => s.fieldErrors.birthday)
  const setField = useCreatorOnboardingStore((s) => s.setField)

  const [{ year, month, day }, setParts] = useState(() =>
    parseBirthday(birthday),
  )

  const update = useCallback(
    (patch: { y?: string; m?: string; d?: string }) => {
      setParts((prev) => {
        return {
          year: patch.y ?? prev.year,
          month: patch.m ?? prev.month,
          day: patch.d ?? prev.day,
        }
      })
    },
    [],
  )

  useEffect(() => {
    if (year && month && day) {
      setField(
        'birthday',
        `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      )
    } else {
      setField('birthday', '')
    }
  }, [day, month, setField, year])

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 80 }, (_, i) => `${current - 18 - i}`)
  }, [])

  const ageError = useMemo(() => {
    if (!year || !month || !day) return null
    const candidate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    if (isAtLeast18(candidate)) return null
    return t`Tenés que ser mayor de 18 años para usar Marz.`
  }, [day, month, year])

  return (
    <div className="flex w-full flex-col items-center gap-9 max-sm:gap-6">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground max-sm:text-[22px]">
          {t`¿Cuándo es tu cumpleaños?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Las marcas filtran por rango de edad. Nunca publicamos la fecha exacta.`}
        </p>
      </div>

      <div className="flex w-full max-w-[520px] gap-3">
        <FieldRow label={t`Día`} className="flex-1">
          {(aria) => (
            <Select value={day} onValueChange={(v) => update({ d: v })}>
              <SelectTrigger {...aria} className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[280px]">
                {Array.from({ length: 31 }, (_, i) => `${i + 1}`).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
        <FieldRow label={t`Mes`} className="flex-[1.4]">
          {(aria) => (
            <Select value={month} onValueChange={(v) => update({ m: v })}>
              <SelectTrigger {...aria} className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[280px]">
                {MONTHS().map((name, i) => (
                  <SelectItem key={name} value={`${i + 1}`}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
        <FieldRow label={t`Año`} className="flex-1">
          {(aria) => (
            <Select value={year} onValueChange={(v) => update({ y: v })}>
              <SelectTrigger {...aria} className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[280px]">
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldRow>
      </div>
      {(ageError || birthdayError) && (
        <p className="text-xs text-destructive" role="alert">
          {ageError ?? birthdayError}
        </p>
      )}
    </div>
  )
}
