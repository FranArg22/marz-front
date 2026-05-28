# fn-25-feat-027-paid-offer-charge-capture.2 OfferSummaryBlock: monto + bonuses + leyenda cobro

## Description

Crear `src/features/offers/components/OfferSummaryBlock.tsx`: bloque que muestra el resumen financiero de la offer para el sidesheet de envío. Calcula monto base + bonuses potenciales (client-side desde el form state) y muestra la leyenda de cobro solo en plan paid.

Hay un componente similar existente en `src/features/offers/components/OfferSummary.tsx` — leer su implementación antes de empezar. `OfferSummaryBlock` es una variante específica para el sidesheet de envío: más compacto, con leyenda de cobro condicional.

## Componente

**Archivo:** `src/features/offers/components/OfferSummaryBlock.tsx`

**Props:**
```typescript
interface OfferSummaryBlockProps {
  amount: number              // monto base en USD
  bonusTerms?: OfferBonusTermsFormValues  // del form state del sidesheet
  plan: 'free' | 'starter' | 'growth' | 'scale'  // del workspace
}
```

**Render:**
- Monto base: `$X.XX USD (base)`
- Si hay bonuses: línea con el bonus ceiling (máximo posible de bonuses)
- Monto máximo: `$X.XX USD (máximo)` — suma de base + todos los bonuses posibles
- Leyenda "El cobro se realiza cuando el creator acepta": solo si `plan !== 'free'`
- Si `plan === 'free'`: no mostrar ninguna leyenda de cobro (silencio)

**Reglas de implementación:**
- `Intl.NumberFormat` hoisteado a module scope (regla React Doctor — no declararlo dentro del componente)
- Reusar la función `getMaxPayout` de `src/features/offers/components/OfferSummary.tsx` o extraerla a un util compartido en `src/features/offers/utils/` si hace falta en ambos
- Heading con `font-semibold` (regla CLAUDE.md)
- Tailwind shorthands `size-N` / `p-N` cuando ambos ejes son iguales
- Sin estado interno — presentacional puro
- Cero strings hardcoded user-facing: usar `<Trans>` o `t` de Lingui
- Los strings Lingui de este componente los agrega F.8; en esta task usar strings sin traducir para no bloquear, pero marcarlos con `t` macro para que F.8 los encuentre

**Tipo a importar** (ya generado en F.1):
```typescript
import type { OfferBonusTermsFormValues } from '../schemas/createOffer'
```

## Tests (Vitest + Testing Library)

Archivo: `src/features/offers/components/OfferSummaryBlock.test.tsx`

- Render con `amount=100`, `bonusTerms` con un speed bonus del 10% → muestra `$100.00`, `$10.00` (bonus), `$110.00` (max).
- Render sin bonuses → muestra solo `$100.00` base y `$100.00` max (o solo base si no hay bonus es igual).
- `plan='free'` → NO renderiza la leyenda de cobro.
- `plan='starter'` → SÍ renderiza la leyenda de cobro.
- `plan='growth'` → SÍ renderiza la leyenda de cobro.
- Cero `new Date()` ni `Date.now()` en el componente (regla React Doctor).

## Acceptance

- Existe `src/features/offers/components/OfferSummaryBlock.tsx` con props descritas.
- `Intl.NumberFormat` declarado a module scope, no dentro del componente (verificar con grep).
- Render condicional de leyenda cobro testeado (plan free → absent, plan paid → present).
- Cero strings hardcoded sin Lingui macro (`t` o `<Trans>`).
- Tests pasan.
- Verify: `pnpm vitest run src/features/offers/components/OfferSummaryBlock && pnpm lint && pnpm typecheck`

## Done summary
Implemented fn-25-feat-027-paid-offer-charge-capture.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: