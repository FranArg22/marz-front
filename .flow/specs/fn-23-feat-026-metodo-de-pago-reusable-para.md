# FEAT-026: Método de pago reusable para offers — Frontend

## Overview

Extiende `BillingPage` (ya existente de FEAT-025) para consumir el nuevo shape del response `GET /v1/billing/subscription` y mostrar un bloque "Método de pago" con `PaymentMethodCard`. El cliente Orval ya fue regenerado contra el backend dev.

Estado de partida:
- `BillingPaymentMethod` (nuevo): `{ stripe_payment_method_id, card_brand, card_last4 }` ya generado en `src/shared/api/generated/model/billingPaymentMethod.ts`
- `BillingSubscription` (actualizado): campos `subscription_payment_method`, `offers_payment_method`, `same_payment_method` ya generados; campo `card` **eliminado**
- `BillingCardSummary` **ya no existe** en el modelo generado
- `BillingPage.tsx` aún referencia `subscription.card` → typecheck rojo → F.2 migra esto

## Scope (solo frontend)

**Incluye**:
- Migrar referencias al campo `card` → nuevo shape `subscription_payment_method` (F.2)
- `src/features/billing/analytics.ts` con `trackBillingEvent` no-op (F.3)
- `PaymentMethodCard` componente reusable (F.4)
- Bloque "Método de pago" en `BillingPage` con lógica `same_payment_method` (F.5)
- Strings i18n nuevos para el bloque (F.6)

**Fuera de scope**:
- Ningún endpoint nuevo (el backend ya está)
- `pnpm api:sync` (ya corrido)
- Divergencia PM (futuro post-MVP)

## Acceptance global

- `pnpm typecheck` pasa sin `subscription.card` ni `BillingCardSummary`
- `pnpm test` pasa todos los tests del feature billing
- `pnpm i18n:extract` limpio (sin strings hardcoded)
- `pnpm quality-gates` verde

## Tasks

| ID | Título | Deps |
|----|--------|------|
| F.2 | Migrar consumers del campo `card` | — |
| F.3 | trackBillingEvent stub + tipos | — |
| F.4 | PaymentMethodCard component | F.2 |
| F.5 | BillingPage bloque "Método de pago" | F.2, F.3, F.4 |
| F.6 | i18n strings nuevos | F.5 |
