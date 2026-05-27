# e2e-fixtures

Cómo consumir desde Playwright (`src/test/e2e/`) los fixtures HTTP que el backend expone bajo `/v1/test/*`. El objetivo es seedear estado determinístico sin recorrer el flow de negocio completo.

Audiencia: agente AI que escribe E2E. El catálogo completo de endpoints y las reglas de diseño viven en el repo backend (`marz-api/profiles/knowledge/e2e-fixtures.md`). Acá solo lo que el front necesita.

## Cliente test API

Generado con Orval target **separado** del cliente productivo:

- Spec: `openapi/test-spec.json` (regenerado por `pnpm api:sync` desde `${API_URL}/test-openapi.yaml`).
- Cliente: `src/shared/api/test-generated/`.
- Mutator: `src/shared/api/test-mutator.ts`. Inyecta `X-Test-Secret` desde `process.env.MARZ_TEST_SECRET`. Si falta el secret, lanza al crear el request — no falla silencioso.

**Importable solo desde `src/test/**`.** Nunca usar el cliente test en código de producto. Si lo importás en `src/features/\*\*`, el bundle se va a romper porque `process.env` no está disponible en browser y porque exponer el secret en el bundle es un agujero.

## Regenerar el cliente tras cambios del backend

```bash
API_URL=http://marz-dev.test pnpm api:sync
```

Eso fetchea `openapi.yaml` Y `test-openapi.yaml` del backend corriendo en `${API_URL}`, regenera los 3 clientes (`marz`, `marzZod`, `marzTest`) y formatea. Si el backend agregó/cambió un endpoint test, esto trae los nuevos símbolos a `src/shared/api/test-generated/test/test.ts`.

Si el backend está caído, `api:sync` falla. Levantar `make local-up` en `marz-api` primero.

## Catálogo (al 2026-05-18)

Funciones generadas en `src/shared/api/test-generated/test/test.ts`. Naming = `operationId` del OpenAPI:

| Función                     | Endpoint                                              | Idempotente         | Uso típico                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestAccount`         | `POST /v1/test/accounts`                              | Sí                  | Crear brand o creator. Con `kind`/`plan`/`onboarding_status`/`workspace_name` opcionales setea todo en una sola llamada.                                                                                                                                                                                                                   |
| `purgeTestAccounts`         | `POST /v1/test/accounts:purge`                        | Sí                  | Limpiar zombies entre suites. Pattern SQL LIKE obligatorio (`%` o `_`).                                                                                                                                                                                                                                                                    |
| `setTestOnboardingState`    | `POST /v1/test/accounts/{clerk_user_id}/onboarding`   | Sí                  | Forzar `kind_pending`/`onboarding_pending`/`onboarded`.                                                                                                                                                                                                                                                                                    |
| `onboardTestAccountFull`    | `POST /v1/test/accounts/{clerk_user_id}/onboard-full` | Sí                  | Onboarded + workspace o creator profile creado.                                                                                                                                                                                                                                                                                            |
| `deleteTestAccount`         | `DELETE /v1/test/accounts/{clerk_user_id}`            | Sí                  | Cleanup.                                                                                                                                                                                                                                                                                                                                   |
| `createTestConversation`    | `POST /v1/test/conversations`                         | No                  | Crea conversation entre brand y creator. Soporta `seed_messages`, `seed_offer_ready`.                                                                                                                                                                                                                                                      |
| `bulkSeedTestInboxItems`    | `POST /v1/test/notifications/inbox-items/bulk-seed`   | Sí                  | Siembra N items de inbox. Re-seedear con mismo `(recipient, section, kind, source_ref)` devuelve mismo ID.                                                                                                                                                                                                                                 |
| `setTestInboxItemStatus`    | `POST /v1/test/notifications/inbox-items/{id}/status` | Sí                  | Forzar `read`/`closed`/`resolved`.                                                                                                                                                                                                                                                                                                         |
| `emitTestEvent`             | `POST /v1/test/events/emit`                           | Depende del handler | Re-emite un `DomainEvent` al bus in-process del API. **No escribe al outbox.** Usalo solo para disparar side effects (proyecciones, notifications); NO para validar persistencia del outbox.                                                                                                                                               |
| `createTestFault`           | `POST /v1/test/faults`                                | One-shot            | Registra una fault que se aplica a la próxima request matching y se consume. Útil para forzar 500 en un endpoint específico.                                                                                                                                                                                                               |
| `resetTestWorkspace`        | `POST /v1/test/notifications/inbox-items/reset`       | Sí                  | Wipea inbox items del workspace. **Scope honesto**: NO toca otros BCs.                                                                                                                                                                                                                                                                     |
| `provisionTestSubscription` | `POST /v1/test/billing/subscription`                  | Sí                  | Pone un brand workspace en plan pago **real** (Stripe test: customer + `pm_card_visa` + subscription) → charge-on-send funciona. Lo usa `seed-conversation` para que la brand arranque paga. Body: `brand_workspace_id`, opcionales `plan` (default `growth`)/`interval`/`email`. Handler raw (no generated client; se llama con `fetch`). |

## Estructura del árbol E2E (post-reorg 2026-05-20)

```
src/test/e2e/
  support/          # mecánica de la suite, NUNCA tests
    fixtures.ts     # único `test.extend` — re-exporta TestUser, ChatPair, seeders
    test-user.ts    # clase TestUser (Clerk + backend)
    chat-pair.ts    # createChatPair + variantes
    clerk.ts        # Clerk Admin API + getClerkSessionToken
    seeders.ts      # seedInboxItems / setInboxItemStatus / resetInbox
    env.ts          # CLERK_SECRET, API_BASE_URL, E2E_RUN_ID
    global-setup.ts # carga .env.local + clerkSetup()
    campaign-board-mocks.ts
  poms/             # Page Object Models por superficie de UI
    app-shell.pom.ts
    workspace.pom.ts
    conversation.pom.ts
    deliverable-panel.pom.ts
    inbox.pom.ts
  suites/           # tests organizados por dominio (NUNCA por FEAT-NNN)
    smoke/          health.spec, app-shell.spec
    identity/       onboarding, creator-birthday, creator-channels
    workspace/      shell.spec
    chat/           send-receive, history-scroll, offer-sent
    deliverables/   link-live-updates, request-changes-single, draft-version-history, multistage-unlock
    campaigns/      configuration-wizard, creator-board, brief-builder-*, brief-to-configuration-handoff
    payments/       mark-as-paid, brand-payment-highlight
    platform-cleanup/ social-platforms
    inbox/          inbox.spec
```

**Reglas duras:**

- Specs **siempre** importan de `'../../support/fixtures'` (nunca `@playwright/test` salvo `import type {...}`).
- Selectores **siempre** viven en POMs. Los specs describen flow, no DOM.
- Carpetas por dominio del producto. **Prohibido** crear carpetas tipo `feat007/`, `feat008/`, `generated/`. El ID del ticket vive en el nombre del `test()` (`ESC-X` / `FEAT-NNN`), no en el path.
- Si te falta seed del backend, marcar `test.skip(true, 'TODO: needs <endpoint> from backend harness')`. Nunca skipear por env var inventada.

## Helpers en `src/test/e2e/support/fixtures.ts`

Envoltorios tipados para las funciones generadas crudas. Reusalos siempre antes de llamar al cliente directo:

```ts
import {
  seedInboxItems,
  setInboxItemStatus,
  resetInbox,
} from '../../support/fixtures'

const ids = await seedInboxItems([
  {
    recipient_account_id: me.id,
    brand_workspace_id: me.brand_workspace?.id,
    section: 'action',
    kind: 'draft_review',
    status: 'pending',
    occurred_at: new Date().toISOString(),
    payload: { ref_id: sourceRefId },
    source_ref: { type: 'deliverable', id: sourceRefId },
  },
])

await setInboxItemStatus(ids[0], 'read')
await resetInbox(workspaceId)
```

Si necesitás un helper que no existe, agregalo a `fixtures.ts` antes de inlinearlo en el spec. Mantiene los specs concisos y centraliza el cleanup.

## Auth en Playwright

Los endpoints `/v1/test/*` van con `X-Test-Secret` (lo inyecta `test-mutator.ts` automáticamente). NO requieren Clerk session.

Para las llamadas a la API **productiva** (`/v1/me`, `/v1/inbox`, etc.) desde el browser durante un spec, el flow es:

1. `testUser.signIn(page)` — usa `@clerk/testing/playwright` para crear session real en Clerk dev.
2. Las requests del browser llevan la cookie Clerk; el server SSR de TanStack Start lee `auth().getToken()` y agrega `Authorization: Bearer ...`.
3. El cliente test (Orval `marzTest`) corre **desde Node**, no desde el browser; usa `X-Test-Secret`, no Clerk.

**Importante**: el `clerk_m2m_token` que devuelve `createTestAccount` es placeholder (`test-m2m:<user_id>`), NO un JWT válido. No lo uses como Bearer contra `/v1/...`. La autenticación real del browser sale por `clerk.signIn`.

## Patrón estándar de un spec

```ts
test('ESC-X: descripción', async ({ page, onboardedBrandUser }) => {
  // 1. Setup: helpers (que llaman al harness).
  const me = await onboardedBrandUser.onboardFull('brand')
  const workspaceId = me.brand_workspace?.id
  expect(workspaceId).toBeTruthy()
  await seedInboxItems([...])

  try {
    // 2. Navegación: signIn real con Clerk.
    await onboardedBrandUser.signIn(page)
    await page.goto('/inbox')

    // 3. Asserts: selectores semánticos (role/text/aria-labelledby).
    await expect(
      page.locator('section[aria-labelledby="action-title"]'),
    ).toBeVisible()
  } finally {
    // 4. Cleanup: reset del workspace (idempotente, safe en cualquier estado).
    await resetInbox(workspaceId!)
  }
})
```

Reglas:

- **Selectores semánticos primero** (`getByRole`, `getByLabel`, `aria-labelledby`). `data-testid` solo si no hay otro recurso.
- **Cleanup en `finally`**: el test puede fallar a mitad, igual hay que limpiar.
- **No depender del estado de tests previos**. Cada test seedea su propio fixture.
- **Idempotencia del helper de cleanup**: `resetInbox` no falla si el workspace ya está limpio.

## Cuándo NO usar el harness

- Validar invariantes de dominio que solo se producen por el flow real (ej. "no podés cancelar una offer expirada después de aceptar"): el flow es el contrato. Usá el cliente productivo y los endpoints reales.
- Tests que validan el **outbox** (orden, persistencia, idempotencia por `event_id`): `emitTestEvent` bypasea el outbox. Usá flows reales que escriban a `shared_domain_events`.
- Tests del cliente API generado (Orval, mutators): esos son unit tests con Vitest, no E2E.

## Verificación end-to-end

1. Backend arriba: `curl -sf http://marz-dev.test/health`.
2. `pnpm api:sync` ejecutado y `src/shared/api/test-generated/` con los símbolos que vas a usar.
3. `pnpm typecheck` verde.
4. Spec corriendo: `pnpm test:e2e src/test/e2e/<spec>.spec.ts --workers=1 --reporter=list`.
5. Cleanup: tras la corrida, los workspaces test no quedan con basura (verificar con `purgeTestAccounts` periódico si el dev instance de Clerk se llena).

## Si te falta un fixture

Si el spec necesita estado que ningún endpoint actual produce de forma determinística:

1. No inventes un workaround vía endpoints productivos múltiples (frágil, lento, acopla al flow).
2. **Pedile al agente backend** que agregue el endpoint siguiendo `marz-api/profiles/knowledge/e2e-fixtures.md`. El contrato lo definen ellos; el front lo consume sin tocar tipos a mano (`pnpm api:sync` regenera).
3. Mientras tanto, dejá el test en `test.skip()` con un TODO claro: "TODO: needs <endpoint> from backend harness".

## Lectura obligatoria antes de tocar E2E

- `profiles/knowledge/playwright.md` — runtime, config, debug, MCP.
- `profiles/knowledge/api-client.md` — cómo funciona el cliente Orval productivo (para contrastar con el test client).
- `profiles/knowledge/auth.md` — flujo Clerk en tests (signIn, session token).
