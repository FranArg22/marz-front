# FEAT-016 Creator earnings frontend

## Overview

Implementa el dashboard read-only `Earnings` para creator users en `marz-front`, consumiendo `GET /v1/creators/me/earnings` y `GET /v1/creators/me/earnings/export.csv` del backend (FEAT-016 backend en `marz-api`). Layout sigue el frame Pencil `m63kj` (variante dark). USD-only (CF-13). No hay WebSocket: refresh manual por navegación. Tambien alinea Send Offer al nuevo contrato `bonus_terms` (solo `speed_bonus_windows` en MVP; performance milestones quedan para FEAT-020).

Scope frontend exclusivamente. Backend (tablas Payments, endpoints, eventos `OfferSent v2`/`OfferAccepted v2`/`DeliverableCompleted v3`/`PaymentMarked v2`, Offers API v2) vive en `marz-api` y no se cubre acá. Este épico depende de que el backend de FEAT-016 esté disponible en dev antes de F.1, F.2 y F.7.

## Scope

- Ruta `_creator/earnings.tsx` con `validateSearch` (period, q, cursor).
- Modificación de `CreatorShell` para incluir item Earnings con icon `DollarSign`.
- Componentes feature `src/features/earnings/`: `EarningsPage`, `EarningsKpiGrid`, `EarningsPeriodControl`, `MonthlyEarningsChart`, `PendingBonusPanel`, `PendingBonusCard`, `EarningsPaymentsTable`, `EarningsSearchExportBar`, `exportCsv` util, `analytics`.
- Hooks `useCreatorEarningsQuery` y `useExportCreatorEarningsMutation`.
- Migración de Send Offer a `bonus_terms.speed_bonus_windows`; rechazo de bonuses en multistage; sin performance milestones (FEAT-020).
- Eventos analytics: `earnings_viewed`, `earnings_period_changed`, `earnings_payment_search_used`, `earnings_csv_exported`, `earnings_bonus_opened`, `earnings_payment_opened`.
- `pnpm api:sync` regenera tipos `CreatorEarningsResponse`, `CreatorEarningsPaymentRow`, `CreatorPendingBonus`, `Money`, `MonthlyEarningsBucket`, `OfferBonusTerms`, `OfferSpeedBonusWindow`, `CreateSingleOfferRequest`, `CreateBundleOfferRequest`, `CreateMultiStageOfferRequest`.

Fuera de scope: backend (Payments tables, handlers, jobs, OpenAPI emit), `Performance bonus` (FEAT-020), live refresh WS, payouts reales / proveedor externo.

## Approach

- Source of truth de URL: search params (`period`, `q`, `cursor`) — sin Zustand store.
- Cliente API tipado por Orval; consumo via TanStack Query siguiendo convenciones de `src/features/*/hooks` existentes.
- Layout dark consistente con `CreatorShell`; tokens del `.pen` mapeados via `src/styles.css` shadcn naming. UI redondeada (radii generosos), sin paleta inventada.
- Pagination keyset estandar; sin tope custom.
- Export CSV: mutation devuelve Blob; UI maneja `409 no_payments_to_export` y `X-Truncated: true` (banner CF-14).
- Send Offer: schemas Zod + form alineados a `OfferBonusTerms` regenerado.

## Quick commands

```bash
# Regenerar tipos desde backend dev
pnpm api:sync

# Type check + tests unit
pnpm typecheck
pnpm test

# Smoke E2E (Playwright)
pnpm test:e2e -- earnings
```

## Acceptance

- **R1:** Creator autenticado puede entrar a `/earnings` y ver KPIs (`total_earned`, `earned_in_period`, `pending_payout`, `next_payout`), monthly chart, pending bonuses panel y payments table; brand user es rechazado por route guard.
- **R2:** Cambio de periodo (`30d`/`90d`/`12m`/`all`) y búsqueda actualizan URL search params, refrescan datos via query y normalizan input inválido a defaults.
- **R3:** Pending bonus cards renderizan tipo `speed` con `bonus_pct`, `window_hours`, countdown y CTA `Ver oferta` que navega a `/workspace/conversations/{conversation_id}?offerId={offer_id}`. Performance bonus no se renderiza.
- **R4:** Payments table es paginable, soporta search; rows navegan a `/workspace/conversations/{conversation_id}?paymentId=...` o `?deliverableId=...` según `kind`.
- **R5:** Export CSV descarga blob con filtros visibles, maneja `409 no_payments_to_export` con mensaje claro y muestra banner CF-14 cuando response trae `X-Truncated: true`.
- **R6:** Eventos analytics `earnings_viewed`, `earnings_period_changed`, `earnings_payment_search_used` (con debounce), `earnings_csv_exported`, `earnings_bonus_opened`, `earnings_payment_opened` se emiten con payloads correctos.
- **R7:** Send Offer envía `bonus_terms.speed_bonus_windows` válido para `single`/`bundle`; `multistage` no muestra UI de bonos a nivel Offer; types compilan con OpenAPI nuevo y la UI ya no referencia el legacy `speed_bonus`.
- **R8:** Visual del dashboard ≥95% match contra Pencil frame `m63kj` en desktop dark; light theme usa tokens existentes sin hardcodes.

## Early proof point

Task fn-15-feat-016-creator-earnings-frontend.1 valida el approach fundamental: regenera el cliente Orval desde el backend dev de FEAT-016 y deja la ruta `/earnings` accesible solo para creator. Si fallara (tipos faltantes, route guard roto, backend no disponible) hay que pausar el épico y resolver upstream antes de seguir con .2+.

## Requirement coverage

| Req | Description                          | Task(s)                                                                                                                            | Gap justification |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1  | Ruta creator + KPIs + chart visibles | fn-15-feat-016-creator-earnings-frontend.1, fn-15-feat-016-creator-earnings-frontend.3                                             | —                 |
| R2  | URL state + período + search         | fn-15-feat-016-creator-earnings-frontend.2, fn-15-feat-016-creator-earnings-frontend.3, fn-15-feat-016-creator-earnings-frontend.5 | —                 |
| R3  | Pending bonus speed + CTA            | fn-15-feat-016-creator-earnings-frontend.4                                                                                         | —                 |
| R4  | Payments table + navegación          | fn-15-feat-016-creator-earnings-frontend.5                                                                                         | —                 |
| R5  | Export CSV + truncated banner        | fn-15-feat-016-creator-earnings-frontend.5                                                                                         | —                 |
| R6  | Analytics events                     | fn-15-feat-016-creator-earnings-frontend.6                                                                                         | —                 |
| R7  | Send Offer bonus_terms alignment     | fn-15-feat-016-creator-earnings-frontend.7                                                                                         | —                 |
| R8  | Visual fidelity dark + tokens        | fn-15-feat-016-creator-earnings-frontend.3, fn-15-feat-016-creator-earnings-frontend.4, fn-15-feat-016-creator-earnings-frontend.5 | —                 |

## References

- Solution doc: `marz-docs/features/FEAT-016-creator-earnings/03-solution.md`
- Pencil frame: `m63kj` (variante dark)
- Workspace CLAUDE.md: `marzv2/CLAUDE.md`
- Frontend CLAUDE.md: `marz-front/CLAUDE.md`
- Backend epic dependency (vive en `marz-api`): endpoints `/v1/creators/me/earnings`, `/v1/creators/me/earnings/export.csv`, `POST /v1/offers` v2.
