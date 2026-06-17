# fn-31-feat-039-e2e-ajustes-perfil-de-marca.1 Instrumentar componentes con data-testid para E2E de Ajustes

## Description

Los tests E2E de FEAT-039 necesitan localizadores estables para anclar assertions sin depender de texto visible. Este task agrega `data-testid` a los componentes de la sección Ajustes. No se crea ningún test aquí; solo se instrumenta código de producción.

### Cambios requeridos

#### 1. `src/features/identity/settings/SettingsLayout.tsx`

En el map de `settingsTabs`, al renderizar cada `<Link>`, agregar `data-testid` con el id de la tab:
- Link de General: `data-testid="settings.nav.general"`
- Link de Suscripción: `data-testid="settings.nav.subscription"`

Verificar primero la estructura real del archivo antes de editar. El componente actual usa `tab.id` que es `'general'` o `'subscription'`.

#### 2. `src/features/identity/settings/GeneralSection.tsx`

- Al elemento `<form>` raíz: agregar `data-testid="settings.general.form"`
- Al `<Button type="submit">`: agregar `data-testid="settings.general.save_button"`

El botón está en el bloque `<div className="flex justify-end">` al final del form.

#### 3. `src/features/billing/settings/BillingSummary.tsx`

Localizar el botón "Gestionar en Stripe" (que llama a `useCreatePortalSession`). Es el `<Button>` cuyo `onClick` dispara `createPortalSession` o similar. Agregar `data-testid="settings.subscription.manage_stripe_button"`.

Verificar primero la estructura real del archivo. Si hay múltiples botones, agregar solo al que abre el Customer Portal.

#### 4. `src/features/billing/settings/FreePlanCTA.tsx`

Al `<Button type="button" onClick={onUpgrade}>`: agregar `data-testid="settings.subscription.upgrade_cta_button"`.

El componente tiene exactamente un botón.

### Reglas

- NO crear tests ni modificar archivos fuera de los listados.
- Cambio mínimo: solo los atributos `data-testid` indicados.
- Convención: namespace con puntos + snake_case (`settings.section.element_action`).
- Si algún archivo tiene estructura diferente a la descrita, adaptar al contenedor semántico correcto y documentarlo en el Done summary.

### Verificación

```bash
grep -n 'settings.nav.general' src/features/identity/settings/SettingsLayout.tsx
grep -n 'settings.nav.subscription' src/features/identity/settings/SettingsLayout.tsx
grep -n 'settings.general.form' src/features/identity/settings/GeneralSection.tsx
grep -n 'settings.general.save_button' src/features/identity/settings/GeneralSection.tsx
grep -n 'settings.subscription.manage_stripe_button' src/features/billing/settings/BillingSummary.tsx
grep -n 'settings.subscription.upgrade_cta_button' src/features/billing/settings/FreePlanCTA.tsx
pnpm typecheck
```

Cada grep debe retornar exactamente 1 línea. `pnpm typecheck` sin errores.

## Acceptance

- [ ] `SettingsLayout.tsx` tiene `data-testid="settings.nav.general"` en el Link de General.
- [ ] `SettingsLayout.tsx` tiene `data-testid="settings.nav.subscription"` en el Link de Suscripción.
- [ ] `GeneralSection.tsx` tiene `data-testid="settings.general.form"` en el elemento `<form>`.
- [ ] `GeneralSection.tsx` tiene `data-testid="settings.general.save_button"` en el `<Button type="submit">`.
- [ ] `BillingSummary.tsx` tiene `data-testid="settings.subscription.manage_stripe_button"` en el botón de Stripe Portal.
- [ ] `FreePlanCTA.tsx` tiene `data-testid="settings.subscription.upgrade_cta_button"` en el botón de upgrade.
- [ ] Ningún otro archivo fue modificado.
- [ ] `pnpm typecheck` pasa sin errores.
- [ ] `pnpm quality-gates` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
