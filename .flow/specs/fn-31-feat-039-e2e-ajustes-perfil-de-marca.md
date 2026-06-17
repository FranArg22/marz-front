# fn-31-feat-039-e2e-ajustes-perfil-de-marca FEAT-039 E2E — Ajustes / Perfil de marca

## Overview

Cobertura E2E Playwright para los flujos de FEAT-039: ajustes generales del brand (perfil + marca + logo), sección de suscripción con card de uso del plan, modal de upgrade, flujos de Stripe, y auth matrix de los endpoints nuevos.

Los tests viven en:
- `src/test/e2e/suites/identity/brand-settings-shell.spec.ts`
- `src/test/e2e/suites/identity/brand-settings-general.spec.ts`
- `src/test/e2e/suites/billing/brand-settings-subscription.spec.ts`
- `src/test/e2e/suites/billing/brand-settings-auth-matrix.spec.ts`

## Scope

**Incluye:**
- data-testid en componentes de SettingsLayout, GeneralSection, BillingSummary, FreePlanCTA
- Spec shell: sidebar, redirect /ajustes→/ajustes/general, creator access denied, legacy /billing redirect
- Spec general: datos precargados, guardar campos, validaciones inline, email read-only, logo upload/clear, no-diff no-event
- Spec suscripción: plan usage card (paid/free/scale), degradación parcial, upgrade modal, Stripe portal, checkout
- Auth matrix endpoints nuevos
- Modificar `campaign-list-quota.spec.ts` (ESC-20)

**Fuera de scope:**
- ESC-21: requiere gate en flujo de offers — investigar en T8 antes de implementar
- ESC-22/ESC-23: requieren control de reloj de la app — agregar como `test.skip` con TODO
- Verificación de outbox en E2E: no existe endpoint de test para leer outbox_events

## Quick commands

- `pnpm test:e2e -- src/test/e2e/suites/identity/brand-settings-shell.spec.ts`
- `pnpm test:e2e -- src/test/e2e/suites/identity/brand-settings-general.spec.ts`
- `pnpm test:e2e -- src/test/e2e/suites/billing/brand-settings-subscription.spec.ts`
- `pnpm typecheck`

## Acceptance

- [ ] data-testid en SettingsLayout, GeneralSection, BillingSummary, FreePlanCTA
- [ ] `brand-settings-shell.spec.ts` cubre ESC-1 (shell), ESC-2, ESC-25
- [ ] `brand-settings-general.spec.ts` cubre ESC-1 (general), ESC-3, ESC-4, ESC-5, ESC-6, ESC-7, ESC-8, ESC-9, ESC-10, ESC-24
- [ ] `brand-settings-subscription.spec.ts` cubre ESC-11 a ESC-18
- [ ] `brand-settings-auth-matrix.spec.ts` cubre ESC-19
- [ ] `campaign-list-quota.spec.ts` actualizado para ESC-20
- [ ] ESC-21 investigado y documentado
- [ ] ESC-22/ESC-23 como `test.skip` con TODO
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm quality-gates` verde

## References

- `src/features/identity/settings/` — componentes de ajustes generales
- `src/features/billing/settings/` — componentes de suscripción
- `src/routes/_brand/ajustes.tsx`, `billing.tsx`
- `src/test/e2e/support/fixtures.ts`, `test-user.ts`
