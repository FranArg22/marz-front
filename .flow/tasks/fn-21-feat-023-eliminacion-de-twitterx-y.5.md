---
satisfies: [R5, R6]
---

## Description

Cerrar el epic con sweep de referencias legadas, limpieza i18n si corresponde y verificación local/e2e focalizada. Esta task no introduce comportamiento nuevo: valida que las tasks previas dejaron el frontend consistente.

**Size:** S
**Files:** `src/**` no generado, `src/shared/i18n/locales/**`, tests/e2e tocados por el sweep.

## Approach

- Ejecutar grep de referencias legadas excluyendo `src/shared/api/generated/**` y revisar manualmente cada hit por contexto.
- Limpiar catálogos i18n si sólo quedan msgids huérfanos de `X / Twitter`.
- Ejecutar checks estándar y smoke e2e focalizado.
- Documentar cualquier excepción permitida en el cierre de task, especialmente `"x"` usado como dato arbitrario no plataforma.

## Investigation targets

**Required**
- `src/shared/i18n/locales/en/messages.po:3003` — msgid actual de X/Twitter.
- `src/shared/i18n/locales/es/messages.po:3003` — msgid/msgstr actual de X/Twitter.
- `package.json:17-23` — scripts de lint/typecheck/test/e2e.
- `src/test/e2e/onboarding.spec.ts:123` — smoke onboarding.
- `src/test/e2e/campaign-configuration.spec.ts` — smoke configuration/activate.

**Optional**
- `profiles/knowledge/playwright.md` — convenciones e2e locales.

## Acceptance

- [ ] `rg -n 'twitter_x|Twitter|Twitch|"twitch"|"x"' src --glob '!src/shared/api/generated/**'` no devuelve hits relevantes de plataforma; excepciones documentadas por contexto.
- [ ] Catálogos i18n no conservan `X / Twitter` como opción visible huérfana.
- [ ] `pnpm lint`, `pnpm typecheck` y `pnpm test` pasan.
- [ ] `pnpm test:e2e -- onboarding campaign-configuration` pasa; si el entorno no puede correr e2e, registrar comando, error y razón ambiental.

## Done summary
Sweep de referencias legadas X/Twitter completado; i18n limpio y checks estándar pasando.
## Evidence
- Commits:
- Tests:
- PRs: