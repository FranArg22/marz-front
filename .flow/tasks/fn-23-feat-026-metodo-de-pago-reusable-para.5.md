# fn-23-feat-026-metodo-de-pago-reusable-para.5 i18n strings bloque metodo de pago

## Description

Correr el pipeline i18n para extraer y compilar los strings nuevos introducidos en las tasks anteriores (`.3` y `.4`). Verificar que todos los strings visibles usen `t\`...\`` y que los catálogos `.po` sean válidos.

## Strings nuevos esperados

Los strings a extraer son los introducidos en `PaymentMethodCard.tsx` y `BillingPage.tsx` (bloque `PaymentMethodBlock`):

| String (es-AR) | Contexto |
|---|---|
| `Método de pago` | Título card combinada (same=true) |
| `Se usa para suscripción y pagos a creators` | Badge secondaryLabel |
| `Método de pago de la suscripción` | Título card suscripción (same=false) |
| `Método de pago para pagos a creators` | Título card offers (same=false) |
| `Sin método de pago` | Fallback en PaymentMethodCard cuando PM es null |
| `Gestionar ${title} en Stripe` | aria-label del botón (interpolado con título dinámico) |

Verificar que "Gestionar en Stripe" (el label visible del botón) ya existe en `BillingPage.tsx` de FEAT-025 y está traducido. Si no está, agregar la traducción también.

## Pasos

1. Correr `pnpm i18n:extract`. Esto actualiza `src/shared/i18n/locales/es/messages.po` y `src/shared/i18n/locales/en/messages.po` con las nuevas keys.
2. Completar las traducciones faltantes en ambos `.po`:
   - **es-AR** (`locales/es/messages.po`): los strings son en español, así que `msgstr` = `msgid` en la mayoría de los casos (Lingui usa el source como key).
   - **en-US** (`locales/en/messages.po`): traducir al inglés. Ejemplos:
     - `Método de pago` → `Payment method`
     - `Se usa para suscripción y pagos a creators` → `Used for subscription and creator payments`
     - `Método de pago de la suscripción` → `Subscription payment method`
     - `Método de pago para pagos a creators` → `Offers payment method`
     - `Sin método de pago` → `No payment method`
3. Correr `pnpm i18n:compile` para generar los `.js` compilados.
4. Correr `pnpm quality-gates` para verificar que `check:i18n-standards` pasa.

## Reglas

- NO hardcodear strings visibles al usuario. Todo por `t\`...\`` de `@lingui/core/macro`.
- Si al correr `pnpm i18n:extract` aparecen strings inesperados no relacionados con esta feature, no modificarlos.
- Cero `eslint-disable lingui/no-unlocalized-strings` nuevo salvo para valores técnicos no visibles (ej. atributos CSS, IDs de Stripe).

## Verificación

```bash
pnpm i18n:extract && pnpm i18n:compile && pnpm quality-gates
```

`check:i18n-standards` debe pasar sin warnings.

## Acceptance

- `pnpm i18n:extract` no reporta strings sin traducción en el scope de `src/features/billing/`.
- `src/shared/i18n/locales/en/messages.po` y `locales/es/messages.po` tienen `msgstr` no vacío para los 6 strings nuevos.
- `pnpm i18n:compile` sin errores.
- `pnpm quality-gates` verde (incluye `check:i18n-standards`).

## Done summary
Implemented fn-23-feat-026-metodo-de-pago-reusable-para.5; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: