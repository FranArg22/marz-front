# fn-22-feat-025-paid-plans-stripe-billing-ui.2 Hooks de data billing (4 hooks Orval-backed)

## Description
Crear 4 hooks tipados, todos wrappers finos sobre los hooks Orval-generated, en `src/features/billing/hooks/`. La regla del repo (`profiles/knowledge/api-client.md`) prohíbe `fetch` crudo, edición de `src/shared/api/generated/**`, y uso directo del `mutator`. Usar exclusivamente los hooks generados.

## Hooks a crear

Verificar primero el nombre exacto que Orval generó en `src/shared/api/generated/` (depende del tag del OpenAPI, suele ser `useGetBillingPlans`, `useGetBillingSubscription`, `useCreateBillingCheckoutSession`, `useCreateBillingPortalSession`). El wrapper expone un nombre estable de feature.

### `useBillingPlans()`

- Archivo: `src/features/billing/hooks/useBillingPlans.ts`.
- Wrappea `useGet...BillingPlans` de Orval.
- Query key derivada del hook generado (no inventar; Orval ya la expone).
- `staleTime` default (catalogo casi inmutable; no necesita refetch agresivo).

### `useBillingSubscription(options?)`

- Archivo: `src/features/billing/hooks/useBillingSubscription.ts`.
- Wrappea `useGet...BillingSubscription` de Orval.
- Acepta `options?: { staleTime?: number; refetchInterval?: number | false; enabled?: boolean }` y los reenvía a `query` del hook generado.
- Defaults: `staleTime: 60_000`, `refetchInterval: false`.
- Manejo de 404 `no_subscription`: el hook devuelve el error como `ApiError`; quien consume decide qué hacer (la pill renderiza `null`, la BillingPage redirige).

### `useCreateCheckoutSession()`

- Archivo: `src/features/billing/hooks/useCreateCheckoutSession.ts`.
- Wrappea la mutation generada para `POST /v1/billing/checkout-sessions`.
- Genera `Idempotency-Key` por intento de submit usando `crypto.randomUUID()` (forma parte del header request; pasar via el campo que Orval expone para custom headers — verificar `mutator.ts`).
- Devuelve la mutation tipada.

### `useCreatePortalSession()`

- Archivo: `src/features/billing/hooks/useCreatePortalSession.ts`.
- Wrappea la mutation generada para `POST /v1/billing/portal-sessions`.
- Genera `Idempotency-Key` por intento con `crypto.randomUUID()`.
- Devuelve la mutation tipada.

## Reglas

- Los 4 archivos exportan named exports; no `default export`.
- Reusar tipos generados de Orval, no redeclarar request/response.
- Cero validación inline; los schemas Zod generados se usan en bordes si hace falta narrow.
- Errores como `ApiError` (ver `profiles/knowledge/errors.md`).
- Cero server state replicado a Zustand.

## Tests (Vitest)

Archivo por hook, junto al hook (`*.test.ts`). Test mínimo por hook:

- `useBillingPlans`: provider con `QueryClient`, mockear el response del mutator, render con `renderHook`, assert que la query devuelve `data` correctamente.
- `useBillingSubscription`: idem + caso 404 → `error` definido y `data` undefined.
- Las 2 mutations: `mutate` con payload válido invoca el mutator con headers que incluyen `Idempotency-Key` no vacío y distinto entre llamadas.
## Acceptance
- Existen los 4 archivos en `src/features/billing/hooks/` con named exports.
- Cada hook re-exporta tipos desde `src/shared/api/generated/` (sin redeclarar).
- `useCreateCheckoutSession` y `useCreatePortalSession` envían `Idempotency-Key` distinto por invocación (verificado en test).
- Cero `fetch(` crudo en `src/features/billing/`.
- Cero edición de `src/shared/api/generated/**`.
- Cero `useEffect` con fetch.
- Tests por hook pasan.
- Verify: `pnpm vitest run src/features/billing/hooks && pnpm lint && pnpm typecheck`
## Done summary
Implemented fn-22-feat-025-paid-plans-stripe-billing-ui.2; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: