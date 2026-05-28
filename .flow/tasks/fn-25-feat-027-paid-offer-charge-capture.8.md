# fn-25-feat-027-paid-offer-charge-capture.8 i18n strings Lingui (es-AR + en-US): summary, banner, accept errors, toasts

## Description

Extraer y traducir todas las strings user-facing nuevas añadidas en F.2–F.7 usando `pnpm i18n:extract` + `pnpm i18n:compile`. Las tasks anteriores usaron `t` macro / `<Trans>` sin traducir — esta task completa las traducciones en `es-AR` y `en-US`.

## Contexto del sistema i18n

Leer `profiles/knowledge/i18n.md` antes de empezar. En resumen:
- Catalogo en `locales/es-AR/messages.po` y `locales/en-US/messages.po`.
- `pnpm i18n:extract` scanea el código y actualiza los `.po` con nuevas keys.
- `pnpm i18n:compile` compila los `.po` a `.js` (los archivos compilados están committeados).
- `check:i18n-standards` falla si hay strings hardcoded sin macro.

## Strings a traducir

### OfferSummaryBlock (`F.2`)
- `"Resumen de pago"` (o el heading del bloque)
- `"Base"` (label monto base)
- `"Bonus máx."` (label bonus)
- `"Total máximo"` (label max payout)
- `"El cobro se realiza cuando el creator acepta"` (leyenda plan paid)

### OfferSendErrorBanner (`F.3`)
- `"Tu tarjeta fue declinada. Verificá los datos o usá otra tarjeta."` (`card_declined`)
- `"Tu tarjeta no tiene fondos suficientes."` (`insufficient_funds`)
- `"Tu tarjeta está vencida."` (`expired_card`)
- `"El código de seguridad de tu tarjeta es incorrecto."` (`incorrect_cvc`)
- `"No pudimos procesar el pago. Intentá de nuevo o gestioná tu tarjeta."` (`hold_failed_generic` / fallback)
- `"Gestionar tarjeta en Stripe"` (CTA portal)

### useOfferActions 402 toasts (`F.6`)
- `"Los fondos reservados expiraron"` (`hold_expired`)
- `"El brand necesita actualizar su tarjeta"` (`card_declined`)
- `"No se pudo procesar el pago"` (`capture_failed_generic`)

### CheckoutReturnPage (`F.5`)
- `"Esperando confirmación…"` (spinner heading)
- `"Estamos confirmando el pago con Stripe."` (spinner body)
- `"Tardamos más de lo esperado"` (timeout heading)
- `"Tu pago puede estar procesándose. Podés volver a intentar o revisar el estado luego."` (timeout body)
- `"Reintentar"` (CTA retry)

### Toasts de conversación/inbox (`F.7`)
- `"Offer enviada"` (success)
- `"Volviste sin enviar la offer"` (cancelled)
- `"No pudimos procesar tu tarjeta. Probá de nuevo o gestioná tu tarjeta."` (failed)

## Pasos

1. Correr `pnpm i18n:extract` — actualiza los `.po` con las keys nuevas encontradas en código.
2. Editar `locales/es-AR/messages.po`: completar las traducciones en español rioplatense para cada key nueva (las keys suelen ser el texto en inglés o un ID — ver el patrón del repo).
3. Editar `locales/en-US/messages.po`: completar las traducciones en inglés.
4. Correr `pnpm i18n:compile` — genera los archivos compilados.
5. Correr `pnpm check:i18n-standards` — debe pasar sin errores.
6. Committear todos los `.po` y los compilados.

## Acceptance

- `pnpm i18n:extract` corre limpio (sin warnings de strings faltantes en código nuevo).
- `pnpm check:i18n-standards` pasa.
- Todas las strings listadas arriba tienen traducción en `es-AR` y `en-US`.
- Los archivos compilados están incluidos en el commit.
- Cero strings hardcoded user-facing en el código nuevo (verificable con `pnpm check:i18n-standards`).
- Verify: `pnpm i18n:extract && pnpm i18n:compile && pnpm check:i18n-standards && pnpm lint && pnpm typecheck`

## Done summary
Implemented fn-25-feat-027-paid-offer-charge-capture.8; derive, quality gates and task review passed.
## Evidence
- Commits:
- Tests:
- PRs: