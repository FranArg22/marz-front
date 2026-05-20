# qa-review.md

Criterios de review E2E del front. Aplicar antes que reglas genéricas.

## verdict

- `approved` si specs cubren los test cases del plan Y fallos del runner son bugs del producto o ambientales
- `needs_fixes` si specs tienen bugs propios, no cubren un case del plan, o usan patrones prohibidos (ver lista abajo)
- ante duda producto vs spec: leer el archivo de `src/` involucrado antes de decidir

## patrones flaky → siempre needs_fixes

| señal                                                           | razón                                    |
| --------------------------------------------------------------- | ---------------------------------------- |
| `getClerkSessionToken(page)` antes de `await user.signIn(page)` | "Expected an active Clerk session token" |
| `JSON.parse(await response.text())`                             | rompe con 204                            |
| `expect(JSON.stringify(body)).toContain('x')`                   | matchea dentro de error messages, frágil |
| `page.waitForTimeout(N)`                                        | sleep numérico                           |
| `process.env.E2E_*_ID` para fixtures runtime                    | nadie setea esas env vars                |
| `page.getByText('texto exacto largo')`                          | frágil ante i18n                         |
| `page.locator(':nth-child(N)')`                                 | depende de orden DOM                     |
| spec sin `try/finally` con cleanup                              | cross-talk entre tests                   |
| `import { test } from '@playwright/test'`                       | tiene que ser `'../fixtures'`            |

## issues ambientales — NO needs_fixes por esto

reportar en `issues` pero verdict puede seguir `approved`:

- MARZ_TEST_SECRET faltante (skinner debería inyectarla)
- agent del back no responde (restart docker falló)
- `pnpm api:sync` no corrió (wrappers `test-generated/` desactualizados)
- conflicto de puerto del front

## cobertura

- cada test case del plan → al menos un spec contiene su `case_id` (ej. `ESC-1`)
- spec multi-case OK si nombra explícitamente cada uno (`ESC-1/2/3`)
- case del plan sin spec = issue de cobertura → needs_fixes

## archivos a leer

- `src/test/e2e/fixtures.ts` — confirmar uso correcto de helpers
- `src/shared/api/test-generated/test/test.ts` — confirmar primitivas existen con esa shape
- `src/shared/api/mutator.ts` — confirmar shape error envelope
- componente del producto bajo test (ej. `src/features/onboarding/...`) — distinguir bug producto vs spec mal escrito

## issues_detailed

cada entry:

- `spec_path`: ruta del spec (ej. `feat-023-social-platform-cleanup.spec.ts`). vacío si transversal
- `message`: concreto y accionable. incluir línea si se puede

ok: `"ESC-1 línea 325: getClerkSessionToken(page) debe ir DESPUÉS de await user.signIn(page)"`

mal: `"el test es frágil"`

sin `spec_path` el render no puede linkear. skinner fallback completa `issues_detailed` con spec_path vacío pero perdés el link.

## no es trabajo del reviewer

- reescribir el spec (lo hace el writer en la próxima vuelta)
- decidir si el feature del producto está bien diseñado (PR review humano)
- aprobar specs que skipean cases obligatorios sin justificación
