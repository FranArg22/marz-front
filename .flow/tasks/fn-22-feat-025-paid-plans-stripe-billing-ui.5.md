# fn-22-feat-025-paid-plans-stripe-billing-ui.5 Billing callback page con poll de subscription

## Description
Ruta nueva `/onboarding/brand/billing-callback` que recibe la vuelta desde Stripe Checkout, polea la suscripción hasta activación, y navega al step siguiente del onboarding (o vuelve al paywall si se canceló).

## Archivo

`src/routes/onboarding/brand.billing-callback.tsx` (file-based routing TanStack Router; ver `profiles/knowledge/routing.md`).

## Search params (Zod)

- `checkout: 'success' | 'cancelled'` (validar con Zod en `validateSearch`).
- Validación estricta: cualquier otro valor → redirect a paywall.

## Comportamiento

### Caso `checkout=cancelled`

- Render breve mensaje "Cancelaste el pago".
- Redirect inmediato al paso paywall del onboarding usando `useNavigate` o `throw redirect` en `beforeLoad`/`loader` (regla React Doctor: redirects en `beforeLoad`/`loader`, no en render).

### Caso `checkout=success`

- Render UI de "Activando tu plan…" (spinner + mensaje).
- Usar `useBillingSubscription({ refetchInterval: 2_000 })` hasta que `data.status` ∈ {`trialing`, `active`}.
- Timeout: si no hay activación en 30s, parar el poll, mostrar mensaje "Estamos demorando, refrescá en unos minutos" + CTA "Ir a /billing".
- Cuando se activa:
  - Avanzar al step siguiente del onboarding brand (revisar `src/features/identity/onboarding/brand/store.ts` y `steps.ts` para identificar el siguiente step post-paywall; es B14 confirmation).
  - Navegar a `/onboarding/brand/{nextStepId}`.

## Reglas

- Timing: el campo de tiempo (`new Date()` o `Date.now()` para medir 30s) no puede ir en JSX. Usar `useEffect` con `setTimeout` para el timeout y `useRef` para el `startedAt`.
- Cero `useEffect`-fetch: el poll lo hace React Query vía `refetchInterval`.
- No invalidar manualmente la query de subscription; el `refetchInterval` ya la actualiza.
- `throw redirect` solo en `beforeLoad`/`loader`. En componente render, navegación con `useNavigate({ to: '...' }).then()` dentro de `useEffect` que reacciona al status del query.

## Tests (Vitest)

- `checkout=success` + status `trialing` en el primer fetch → navega a step siguiente (mock `useNavigate`).
- `checkout=success` + status `incomplete` por 30s (mockear timers con `vi.useFakeTimers`) → muestra mensaje timeout + CTA `/billing`.
- `checkout=cancelled` → redirect a paywall.
- Search param inválido → redirect a paywall (testear el `validateSearch`).

## E2E (Playwright)

Archivo: `src/test/e2e/onboarding-brand-paywall.spec.ts` (o equivalente, seguir convención del repo en `src/test/e2e/`).

- Seedear workspace brand con onboarding en step paywall.
- Navegar a `/onboarding/brand/paywall`.
- Click en plan `starter` monthly → CTA "Continuar".
- Verificar redirect a `checkout.stripe.com/...` (modo test).
- En Stripe Checkout test, llenar tarjeta `4242 4242 4242 4242`.
- Verificar redirect a `/onboarding/brand/billing-callback?checkout=success`.
- Esperar a que navegue al step siguiente (B14 confirmation).

Regla de memoria: NO correr `pnpm test:e2e` full; correr solo el archivo nuevo con `pnpm test:e2e <spec-file>`.

Requiere backend dev con Stripe test mode configurado (anexo `stripe-account-setup.md` aplicado).
## Acceptance
- Existe `src/routes/onboarding/brand.billing-callback.tsx`.
- Search params validados con Zod (`validateSearch`).
- Redirects de query string inválido + `checkout=cancelled` están en `beforeLoad`/`loader` con `throw redirect`, no en render.
- Poll con `refetchInterval: 2_000` activo solo cuando `checkout=success`.
- Timeout de 30s detiene el poll y muestra mensaje de fallback.
- Cero `useEffect`-fetch.
- Cero `new Date()` / `Date.now()` directo en JSX.
- Tests Vitest cubren los 4 escenarios (success-activa, success-timeout, cancelled, invalid-param).
- E2E pasa contra backend dev con Stripe test mode.
- Verify: `pnpm vitest run src/routes/onboarding/brand.billing-callback && pnpm test:e2e src/test/e2e/onboarding-brand-paywall.spec.ts && pnpm lint && pnpm typecheck && pnpm react-doctor`
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
