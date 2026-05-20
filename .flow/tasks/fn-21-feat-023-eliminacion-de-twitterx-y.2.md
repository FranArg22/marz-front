---
satisfies: [R3, R6]
---

## Description

Eliminar Twitter/X de la fuente de atribución del onboarding de brand. La pantalla B11 debe ofrecer exactamente las 7 opciones soportadas por backend y conservar el flujo actual de referral.

**Size:** S
**Files:** `src/features/identity/onboarding/brand/types.ts`, `src/features/identity/onboarding/brand/screens/B11AttributionScreen.tsx`, `src/features/identity/onboarding/brand/screens/B11AttributionScreen.test.tsx`, `src/features/identity/onboarding/brand/useSubmitBrandOnboarding.test.ts`, catálogos Lingui si se regeneran.

## Approach

- Remover `twitter_x` del literal local `AttributionNonReferralSource` y del array de opciones de B11.
- Quitar import `Twitter` de `lucide-react` si queda sin uso.
- Actualizar tests de B11 para esperar 7 opciones y verificar que `X / Twitter` no aparece.
- Cubrir el caso backend `422 validation.invalid_value` para `attribution_source=twitter_x`, usando el mensaje del envelope en el feedback existente.
- Mantener intacto el comportamiento referral/non-referral existente.

## Investigation targets

**Required**
- `src/features/identity/onboarding/brand/types.ts:43` — enum local actual.
- `src/features/identity/onboarding/brand/screens/B11AttributionScreen.tsx:20` — definición de opciones.
- `src/features/identity/onboarding/brand/screens/B11AttributionScreen.test.tsx:24` — test de conteo actual.
- `src/features/identity/onboarding/brand/steps.test.ts:148` — validación del paso B11.
- `src/features/identity/onboarding/brand/useSubmitBrandOnboarding.test.ts:122` — patrón de error 422 y toast genérico.

**Optional**
- `src/test/e2e/onboarding.spec.ts:123` — smoke del paso B11.

## Design context

No cambiar layout, tokens ni jerarquía visual. Es una remoción de una opción existente dentro del mismo patrón de radios/chips.

## Acceptance

- [ ] B11 ya no renderiza `X / Twitter` ni importa `Twitter` desde `lucide-react`.
- [ ] `AttributionNonReferralSource` local no contiene `twitter_x`.
- [ ] El test de B11 espera exactamente 7 opciones y conserva pruebas de Instagram/referral.
- [ ] Un error `422` con `code: validation.invalid_value`, `details.field: attribution_source` y `value: twitter_x` muestra el `message` del envelope en el feedback/toast existente.
- [ ] `pnpm test -- B11AttributionScreen` y `pnpm typecheck` pasan o quedan bloqueados sólo por tasks dependientes aún no ejecutadas.

## Done summary
Twitter/X removido de B11 y del tipo local; tests actualizados y 422 invalid_value para twitter_x cubierto con toast usando el message del backend.
## Evidence
- Commits:
- Tests:
- PRs: