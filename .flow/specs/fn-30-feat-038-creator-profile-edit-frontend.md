# fn-30-feat-038-creator-profile-edit-frontend — FEAT-038 Creator Profile Edit — Frontend

## Overview

Nueva pantalla `/_creator/settings` (Ajustes del creator) con cinco secciones editables. El backend ya está desarrollado y el cliente API fue regenerado con `pnpm api:sync` — el diff de archivos generados está en el working tree sin commitear.

La pantalla tiene un sidebar con 5 secciones: General, Colaboraciones, Redes y tarifas, Portfolio, Billetera. Cada sección editable (General, Colaboraciones, Redes y tarifas, Portfolio) tiene un único botón `Guardar` al fondo (`SectionSaveBar`) que persiste todos los cambios de esa sección de una vez. La Billetera usa modal con su propio guardado.

## Scope

**In:**
- Commit del diff de `pnpm api:sync` (archivos generados ya en working tree)
- Ruta `/_creator/settings` con `validateSearch` `{ section: z.enum(['general','colaboraciones','redes-tarifas','portfolio','billetera']).default('general') }`
- Entry "Ajustes" en el nav del shell creator (`src/features/identity/app-shell/navigation.ts`)
- `CreatorSettingsPage` + `SettingsSidebar` + `SectionSaveBar` reutilizable
- `GeneralSection` en `src/features/identity/settings/`: contacto + avatar (presign → S3 → PUT avatar + PATCH contact en un solo Guardar)
- `CollaborationSection`: chips de creator_kinds, pickers de niches/content_types, toggle canje
- `RatesSection`: tarifas por canal (handle/followers read-only) + tarifa UGC
- `PortfolioSection`: 3 slots de video (siempre visibles, `Quitar link` por slot cargado)
- `WalletSection` en `src/features/payments/settings/`: `PayoutAccountCard` + `PayoutAccountModal`
- E2E integral de la pantalla

**Out:**
- Backend (ya desarrollado)
- Cambios a otras features existentes

## Approach

1. **Task .1 — api:sync + scaffolding**: commit del diff, ruta, layout, sidebar, SectionSaveBar. Pantalla navegable con 5 secciones vacías cargando datos del query.
2. **Task .2 — GeneralSection**: form con contacto + avatar. El Guardar orquesta: si hay foto nueva → presign + PUT S3 + PUT avatar; luego PATCH contact.
3. **Task .3 — CollaborationSection**: form con creator_kinds chips, pickers taxonomía, toggle. Validaciones mín/máx en cliente.
4. **Task .4 — RatesSection**: tarifas por canal + UGC en un form. Handle/followers read-only.
5. **Task .5 — PortfolioSection**: 3 slots siempre visibles, Quitar link, replace completo al guardar.
6. **Task .6 — WalletSection + modal**: empty state → modal → cuenta activa. Modal con su propio Guardar.
7. **Task .7 — E2E integral**: flujos completos + estados de error + axe.

## Hooks de data (cliente generado en `src/shared/api/generated/creator/creator.ts`)

Queries:
- `useGetMyCreatorSettings` / `getGetMyCreatorSettingsQueryKey()` → `CreatorSettingsResponse`
- `useGetMyPayoutAccount` / `getGetMyPayoutAccountQueryKey()` → `GetMyPayoutAccount200`

Mutations:
- `useUpdateMyCreatorProfileContact` (`data: UpdateCreatorContactRequest`)
- `useSetMyCreatorAvatar` (`data: SetCreatorAvatarRequest`) → `SetCreatorAvatarResponse`
- `useUpdateMyCreatorProfileCollaboration` (`data: UpdateCreatorCollaborationRequest`)
- `useUpdateMyCreatorRates` (`data: UpdateCreatorRatesRequest`) → `CreatorRatesResponse`
- `useReplaceMyCreatorSampleVideos` (`data: UpdateSampleVideosRequest`) → `ReplaceMyCreatorSampleVideos200`
- `useUpsertMyPayoutAccount` (`data: UpsertPayoutAccountRequest`) → `UpsertMyPayoutAccount200`
- `usePresignCreatorAvatar` en `src/shared/api/generated/onboarding/onboarding.ts` — reutilizado sin cambios

## Quick commands

```bash
pnpm dev                   # servidor dev, http://localhost:3000
pnpm typecheck             # verificar tipos
pnpm test                  # vitest
pnpm test:e2e              # playwright
pnpm work:post             # format + i18n:extract + i18n:compile + quality-gates
```

## Acceptance

- [ ] Ruta `/_creator/settings` navegable; `?section=` controla sección activa; default `general`.
- [ ] Brand en `/_creator/settings` → redirect (guard del group `_creator`).
- [ ] GeneralSection: modificar nombre + foto + campo de contacto → Guardar una vez → todo persistido.
- [ ] GeneralSection: foto formato inválido → error en SectionSaveBar, PATCH contact NO se envía, valores previos intactos.
- [ ] GeneralSection: email visible pero deshabilitado (solo lectura).
- [ ] CollaborationSection: deseleccionar último kind/niche/content_type bloqueado; sexto niche bloqueado; Guardar persiste todos.
- [ ] RatesSection: followers y handle sin input; monto 0/negativo bloqueado; Guardar persiste todas.
- [ ] PortfolioSection: quitar un link + agregar otro + Guardar → ambos cambios persistidos.
- [ ] WalletSection: alta → modal → cuenta con badge Activa; edición bank→external_app; cancelar no persiste; "Marz transfiere en USD" visible en modal.
- [ ] `pnpm typecheck` verde. `pnpm test` verde. `pnpm react-doctor` ≥ 95/100.

## Tasks

- .1 — Commit api:sync + ruta + layout + sidebar + SectionSaveBar
- .2 — GeneralSection: contacto + avatar con guardado unificado
- .3 — CollaborationSection
- .4 — RatesSection
- .5 — PortfolioSection
- .6 — WalletSection + modal
- .7 — E2E integral + estados de error
