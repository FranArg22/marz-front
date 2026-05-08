# FEAT-018 Brand Payments & Spending (frontend)

## Overview

Vista read-only desktop dark para usuarios brand (rol `admin`) que muestra resumen de gasto y tabla de pagos declarados del workspace activo. Frontend consume dos endpoints REST nuevos del backend (FEAT-018 backend / marz-api):

- `GET /v1/brand-workspaces/{workspace_id}/payments/spending` (dashboard agregado + tabla paginada keyset).
- `GET /v1/brand-workspaces/{workspace_id}/payments/spending/export.csv` (export filtrado).

USD-only en toda la UI (CF-13): no hay tabs/selector/columna currency. Sin nuevos eventos WebSocket — refresh manual por botón. Click en fila navega a la conversación con `highlightPaymentId` para resaltar la `PaymentCard` ya persistida por Chat (FEAT-010).

Spec fuente: `marz-docs/features/FEAT-018-brand-payments-and-spending/03-solution.md` (secciones 4, 7).

Diseño Pencil frame: `mLJAj` (desktop dark). Validación visual ≥95%.

## Scope

In scope (frontend):

- Ruta `/_brand/payments` con `validateSearch` (period, campaignId, creatorId, q).
- Item sidebar "Payments & Spending" en `BrandShell` (creator no lo ve).
- Componentes: `BrandPaymentsPage`, `PaymentsPeriodSegmentedControl`, `PaymentKpiGrid` (4 KPIs USD), `MonthlySpendBarChart`, `CampaignSpendDonut`, `BrandPaymentsFilters`, `BrandPaymentsTable`, `PaymentsEmptyState`.
- Server functions + TanStack Query hooks: `useBrandPaymentsSpendingQuery`, `useExportBrandPaymentsCsvMutation`.
- Filtros en search params (sin Zustand).
- Export CSV con manejo de 409 (`no_payments_to_export`, `export_exceeds_limit`).
- Highlight de `PaymentCard` en conversation route via `highlightPaymentId` search param.
- Eventos analytics `brand_payments_*`.

Out of scope:

- Backend (B.1-B.7) — vive en marz-api.
- FEAT-010 (mark-paid endpoint, `payments_declared_payments`, `PaymentCard` persistence).
- WebSocket nuevo (refresh manual).
- Multi-currency (USD-only).
- Mobile / responsive más allá de desktop.

## Approach

1. Sincronizar OpenAPI con `pnpm api:sync` contra dev backend para regenerar `src/shared/api/generated/` cuando B.7 esté en dev.
2. Crear ruta brand + sidebar item antes que la UI completa para validar guards y nav temprano (early proof).
3. Hooks de data + manejo de search params como segunda capa, sin UI compleja todavía.
4. UI dashboard contra frame Pencil `mLJAj`: KPIs, chart mensual, donut, filtros, tabla con keyset pagination.
5. Export CSV + analytics encima de la UI estable.
6. Highlight `PaymentCard` en conversation cierra el loop UX.

Reuse:

- Patrón ruta `_brand` + guard: `src/routes/_brand.tsx`, `src/features/identity/components/BrandShell.tsx`.
- Patrón sidebar item: `src/features/identity/components/SidebarItem.tsx`.
- Patrón TanStack Query con Orval: hooks generados + `src/shared/api/mutator.ts`.
- Tokens shadcn/dark theme: `src/styles.css` (no hardcodear colores).
- Zod search params: ver rutas existentes que usan `validateSearch`.

## Quick commands

```bash
# Sincronizar tipos cuando backend dev tenga endpoints
pnpm api:sync

# Typecheck
pnpm typecheck

# Tests
pnpm test src/features/payments
pnpm test src/routes/_brand

# Dev
pnpm dev
# luego navegar a /payments como brand admin
```

## Acceptance

- **R1:** Solo brand con rol `admin`, onboarding completo y membership ve `/payments`. Creator y otros roles redirigen / muestran 403 fallback consistente con guards existentes.
- **R2:** Sidebar de `BrandShell` incluye item "Payments & Spending" con icono `Wallet` y active state cuando ruta empieza con `/payments`. `CreatorShell` no muestra este item.
- **R3:** Dashboard renderiza 4 KPIs (`Total spent`, `Period spend`, `Pending approval`, `Next debit`) en USD, segmented control de periodo (`30d`/`90d`/`12m`/`All`, default `30d`), barras mensuales, donut con bucket `Otros` (campaigns con share <1% antes de redondear), filtros (campaign, creator, search), y tabla paginada por keyset cursor.
- **R4:** No existe en la UI ningún tab, selector ni columna de currency (CF-13). Montos siempre USD usando formateo consistente.
- **R5:** Filtros y periodo persisten en search params; cambiar cualquiera actualiza URL y dispara nueva query con key estable `["brand-payments-spending", workspaceId, filters]`.
- **R6:** Botón export descarga CSV con filtros aplicados. 409 `no_payments_to_export` muestra toast/inline sin descargar; 409 `export_exceeds_limit` muestra mensaje exacto: "El export excede el límite. Contactá al administrador (Marz) para obtenerlo manualmente.".
- **R7:** Click en fila navega a `/_brand/workspace/conversations/$conversationId` con search param `highlightPaymentId=<declared_payment_id>`; conversation route honra el param y la `PaymentCard` correspondiente se resalta. Si el mensaje no está en primera página, fallback no bloqueante mantiene la conversation abierta.
- **R8:** Empty states para "sin pagos" (workspace nunca tuvo declared_payments) y "sin resultados" (filtros vacíos) son visualmente distintos y accesibles.
- **R9:** Eventos analytics emitidos en sus puntos: `brand_payments_viewed`, `brand_payments_period_changed`, `brand_payments_filter_changed`, `brand_payments_search_used`, `brand_payments_csv_exported`, `brand_payment_opened`, `brand_payments_refresh_clicked`.
- **R10:** Validación visual contra Pencil frame `mLJAj` ≥ 95%. Tabla navegable por teclado, controles con labels accesibles, charts con descripción accesible.

## Early proof point

Task fn-17-feat-018-brand-payments-spending.2 (Ruta brand `/payments` + sidebar item) valida que el guard, el shell y el routing funcionan antes de invertir en UI compleja. Si falla (guards mal cableados, sidebar no acepta el item, ruta no resuelve), reconsiderar la integración con `BrandShell`/`_brand.tsx` antes de continuar con .3+.

## Requirement coverage

| Req | Description               | Task(s)                                  | Gap justification   |
| --- | ------------------------- | ---------------------------------------- | ------------------- |
| R1  | Authz brand admin only    | fn-17-feat-018-brand-payments-spending.2 | —                   |
| R2  | Sidebar item brand-only   | fn-17-feat-018-brand-payments-spending.2 | —                   |
| R3  | Dashboard render completo | fn-17-feat-018-brand-payments-spending.4 | —                   |
| R4  | USD-only, sin currency UI | fn-17-feat-018-brand-payments-spending.4 | —                   |
| R5  | Search params + query key | fn-17-feat-018-brand-payments-spending.3 | —                   |
| R6  | Export CSV + 409 handling | fn-17-feat-018-brand-payments-spending.5 | —                   |
| R7  | Highlight PaymentCard     | fn-17-feat-018-brand-payments-spending.6 | Depende de FEAT-010 |
| R8  | Empty states              | fn-17-feat-018-brand-payments-spending.4 | —                   |
| R9  | Analytics events          | fn-17-feat-018-brand-payments-spending.5 | —                   |
| R10 | Pencil ≥95% + a11y        | fn-17-feat-018-brand-payments-spending.4 | —                   |

## References

- `marz-docs/features/FEAT-018-brand-payments-and-spending/03-solution.md` (secciones 4, 7)
- Pencil frame: `mLJAj` (desktop dark)
- `src/routes/_brand.tsx` (route group brand)
- `src/features/identity/components/BrandShell.tsx`
- `src/features/identity/components/CreatorShell.tsx`
- `src/features/identity/components/SidebarItem.tsx`
- `src/shared/api/mutator.ts` (Orval mutator: auth/errores)
- `src/styles.css` (tokens shadcn light/dark)
- FEAT-010 (mark-paid + PaymentCard) — depend para R7
