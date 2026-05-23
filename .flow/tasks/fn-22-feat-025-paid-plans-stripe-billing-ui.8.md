# fn-22-feat-025-paid-plans-stripe-billing-ui.8 i18n strings billing (Lingui es-AR + en-US)

## Description
Extraer y compilar los catálogos i18n con todos los strings billing nuevos introducidos en tasks 3-7. Validar que no quedaron strings hardcoded y que los catálogos `.po` de es-AR y en-US están completos.

## Pasos

1. Correr `pnpm i18n:extract` (forma parte de `pnpm work:post`).
   - Verificar que en `src/locales/es-AR/messages.po` y `src/locales/en-US/messages.po` aparecen las nuevas keys de:
     - `PlansGrid`, `PlanCard` (titles, CTA, toggle labels).
     - `B13PaywallScreen` (CTA primario, CTA "free" footer, mensajes de error 409/422/502/genérico, loading).
     - Billing callback page ("Activando tu plan…", "Cancelaste el pago", timeout fallback + CTA).
     - `BillingTopbarPill` (3 estados + tooltip + aria-label).
     - `BillingPage` (4 variantes header + sub-mensajes + CTAs).
2. Traducir cada key nueva al español argentino + inglés.
3. Correr `pnpm i18n:compile` para que los `.po` se conviertan al formato runtime.
4. Correr `pnpm check:i18n-standards` (parte de `quality-gates`) y resolver cualquier violación reportada.

## Reglas

- Las strings de planes (`starter`, `growth`, `scale`) que vienen del backend como literal NO se traducen como tal; se mapean con un objeto Lingui-friendly (`<Trans id="plan.starter">Starter</Trans>` o similar). Ver patrón existente en el repo (buscar otra feature que tenga enums traducibles, p. ej. campaign status).
- `Intl.NumberFormat` ya formatea precios; no traducir el currency. Para fechas, usar `'es-AR'` o `'en-US'` según locale activo (revisar cómo el repo expone el locale actual; probablemente via context de Lingui).
- Cero `t\`...\`` con string vacío o placeholder TODO.
- Cero `<Trans>...</Trans>` con texto inglés en .po de es-AR.

## Tests

- `pnpm check:i18n-standards` pasa sin errores.
- Diff de `messages.po` muestra solo las keys nuevas de billing + sus traducciones.
- `pnpm vitest run` sigue verde (un `<Trans>` mal escrito rompe render).
## Acceptance
- `pnpm i18n:extract` corre limpio.
- `pnpm i18n:compile` corre limpio.
- `pnpm check:i18n-standards` pasa.
- `src/locales/es-AR/messages.po` y `src/locales/en-US/messages.po` contienen las nuevas keys de billing con traducciones no vacías.
- Cero strings user-facing fuera de Lingui en los archivos modificados/creados de la épica (`src/features/billing/**`, `src/routes/_brand/billing.tsx`, `src/routes/onboarding/brand.billing-callback.tsx`, `src/features/identity/onboarding/brand/screens/B13PaywallScreen.tsx`, `src/features/identity/app-shell/AppTopbar.tsx`).
- `pnpm work:post` completo pasa (lint, check, typecheck, react-doctor, vitest, e2e, knip, check:api-direct, check:i18n-standards).
- Verify: `pnpm work:post`
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
