# React Doctor cleanup: 64 → 95+

## Overview

`npx -y react-doctor@latest .` reporta **64/100 — Needs work** (522 issues en 254/768 archivos, 14 errores + 508 warnings). El reporte cubre dead code (knip), hydration mismatches SSR, TanStack Query invalidations faltantes, derived state antipatterns, design tokens (font weights, spacing), APIs deprecadas de React 19, navigate-in-render de TanStack Start, perf bundle (Intl, async loops) y a11y.

La épica sube el score lo más cerca posible de 100 fixando categorías por orden de riesgo/impacto:

1. Setup de tooling (knip config + ignores selectivos de react-doctor) — desinfla falsos positivos.
2. Errores hard (rules-of-hooks, effect cleanup, mutable deps, aria).
3. Autofixables de bajo riesgo (codemods React 19 + Tailwind shorthand + design strings).
4. State & effects refactor (derived state, prop callback in effect, cascading setState).
5. Hydration y router patterns (useClientNow, throw redirect).
6. Mutations + invalidations (22 sitios).
7. Perf bundle (hoist Intl, Promise.all, toSorted).
8. A11y + handlers + dead code final + métrica CI.

**Tooling**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm api:sync` (regenera Orval; correr antes si los generados faltan). Pre-commit corre `eslint --fix` + prettier sobre staged files vía husky.

**Patrón canónico de mutation con invalidación** ya existe en `src/features/inbox/hooks/useMarkInboxItemReadMutation.ts:11-27` — replicarlo en las 22 mutations sin invalidate.

## Scope

**Dentro**:
- Tooling: `knip.json`, `react-doctor.config.*` (si aplica), eslint overrides para fixtures Playwright.
- Fix de las categorías listadas en Overview.
- Documentar reglas nuevas en `marz-front/CLAUDE.md`.
- Snapshot del reporte antes/después por fase para tracking.

**Fuera**:
- Cambios funcionales o de UX nuevos.
- Refactors arquitecturales (mover features entre bounded contexts, cambiar router shell, migrar libs).
- `src/features/campaigns/configuration/**` mientras fn-18-campaign-configuration-wizard esté open (riesgo de merge conflict directo). Issues en esos archivos se difieren a fast-follow tras merge de fn-18.
- Dead code preexistente fuera de lo que knip reporte (CLAUDE.md §3 surgical changes).
- Optimizaciones de bundle/perf no listadas por react-doctor.
- Reescribir tests Playwright — solo silenciar el falso positivo `rules-of-hooks` en `src/test/e2e/**`.

## Approach

Trabajar por fases secuenciales (cada fase = 1 task), cada una con su snapshot de `npx react-doctor@latest --json` antes y después. Si el score sube en cada fase y nada rompe (`typecheck + lint + test + test:e2e` green), la fase se mergea y se pasa a la siguiente. Cada task lista los archivos esperados para minimizar overlap entre tasks (todas son secuenciales por construcción — el cleanup es global).

**Falsos positivos a whitelistar** (no fixear):
- `src/test/e2e/fixtures.ts:395` (`use` de Playwright fixture, no de React) — eslint override por path en task 2.
- `src/routes/__root.tsx:79` (script de theme inline pre-hydration, uso legítimo de `dangerouslySetInnerHTML`) — eslint-disable-next-line en task 2.

## Quick commands

```bash
# Snapshot pre/post de cada task
npx -y react-doctor@latest . --verbose > /tmp/rd-before.txt
# ... fixes ...
npx -y react-doctor@latest . --verbose > /tmp/rd-after.txt
diff <(grep -oE 'score:[0-9]+' /tmp/rd-before.txt) <(grep -oE 'score:[0-9]+' /tmp/rd-after.txt)

# Gate por task
pnpm typecheck && pnpm lint && pnpm test
pnpm test:e2e  # solo en tasks que tocan rutas o auth flows

# Knip standalone (task 1)
pnpm exec knip
```

## Acceptance

- **R1:** `npx -y react-doctor@latest .` reporta score ≥ 95 (desde 64). Reproducible localmente y en CI.
- **R2:** 0 errores hard (excluyendo los 2 falsos positivos whitelisted con justificación en código).
- **R3:** Categoría `knip` (dead code) en 0 reales tras configurar `knip.json` con entries correctos para TanStack Router + Vitest + Playwright + scripts. Los reportados restantes son auto-justificados (route trees, Orval generated, Zod schema inference).
- **R4:** Categoría `query-mutation-missing-invalidation` en 0 — toda mutation tiene `onSuccess` con `invalidateQueries` o setQueryData optimista con rollback.
- **R5:** Categoría `rendering-hydration-mismatch-time` en 0 — un único `useClientNow` hook (`useSyncExternalStore`) reemplaza los 23 sitios.
- **R6:** Categoría `tanstack-start-no-navigate-in-render` en 0 — los 8 sitios usan `throw redirect()` en `beforeLoad`/`loader`.
- **R7:** Categoría `no-react19-deprecated-apis` en 0 — codemods oficiales aplicados (forwardRef removal, useFormState → useActionState, Context.Provider implícito).
- **R8:** Categorías de design en 0: `bold-heading` (49), `redundant-size-axes` (12), `redundant-padding-axes` (4), `em-dash-in-jsx-text` (4), `three-period-ellipsis` (1), `vague-button-label` (1).
- **R9:** Categorías de state en 0: `no-prop-callback-in-effect` (6), `no-derived-state-effect` (5), `no-derived-useState` (5), `no-cascading-set-state` (5), `no-effect-event-handler` (2), `rerender-state-only-in-handlers` (1).
- **R10:** Categorías de perf en 0: `js-hoist-intl` (15), `js-combine-iterations` (13), `async-await-in-loop` (11), `async-parallel` (9), `js-tosorted-immutable` (6), `js-set-map-lookups` (3), demás singletons.
- **R11:** Categorías a11y en 0: `role-has-required-aria-props` (2), `no-autofocus` (1), `anchor-is-valid` (1).
- **R12:** `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` pasan al final de cada task.
- **R13:** Reglas codificadas en `marz-front/CLAUDE.md` sección "Coding rules from react-doctor" (mutations invalidate, no `new Date()` en JSX, `throw redirect()` en beforeLoad/loader, `font-semibold` en headings, `size-N` en utilities, no array index keys, Intl al module scope).
- **R14:** CI corre `npx -y react-doctor@latest .` y publica score como comentario de PR (no bloqueante en esta épica, solo métrica visible).

## Early proof point

Task **fn-19-react-doctor-cleanup-64-95.1** valida el approach: configura knip + ignores de react-doctor y silencia los 2 falsos positivos. Si tras esto el score no sube sustancialmente (>= 75) o knip explota con falsos positivos imposibles de excluir, replantear si la épica debe atacar categorías individuales sin tooling base. Si pasa, la siguiente fase (errores hard) confirma que los issues restantes son fixeables sin replantear arquitectura.

## Out-of-scope deferrals

- Issues en `src/features/campaigns/configuration/**` están **diferidos** hasta el merge de fn-18. Una sub-tarea fast-follow tras fn-18 (no parte de esta épica) los limpia. Se trackea en task final.

## Open questions

1. **Bold-heading (49)**: ¿quitar `font-bold` y dejar default (`font-semibold` vía clase) o mover el peso al token CSS `--font-weight-heading` aplicado en `@theme inline`? Default asumido en plan: cambio por archivo a `font-semibold`. Si Design prefiere lo segundo, ajustar la task 6 antes de implementar.
2. **CI gate**: ¿react-doctor como check bloqueante en CI futuro o solo informativo? Default asumido: informativo (R14). Bloqueante quedaría como épica fast-follow.

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
|-----|-------------|---------|-------------------|
| R1  | Score ≥ 95 | fn-19-react-doctor-cleanup-64-95.10 | — |
| R2  | 0 hard errors | fn-19-react-doctor-cleanup-64-95.1, fn-19-react-doctor-cleanup-64-95.2 | — |
| R3  | knip dead code = 0 reales | fn-19-react-doctor-cleanup-64-95.1, fn-19-react-doctor-cleanup-64-95.9 | — |
| R4  | mutation invalidations | fn-19-react-doctor-cleanup-64-95.6 | — |
| R5  | hydration time mismatch | fn-19-react-doctor-cleanup-64-95.5 | — |
| R6  | navigate-in-render | fn-19-react-doctor-cleanup-64-95.5 | — |
| R7  | react19-deprecated-apis | fn-19-react-doctor-cleanup-64-95.3 | — |
| R8  | design fixes | fn-19-react-doctor-cleanup-64-95.3 | — |
| R9  | state & effects | fn-19-react-doctor-cleanup-64-95.4 | — |
| R10 | perf bundle | fn-19-react-doctor-cleanup-64-95.7 | — |
| R11 | a11y | fn-19-react-doctor-cleanup-64-95.8 | — |
| R12 | typecheck + lint + tests verdes | fn-19-react-doctor-cleanup-64-95.1..10 | — |
| R13 | Docs en CLAUDE.md | fn-19-react-doctor-cleanup-64-95.10 | — |
| R14 | CI score como PR comment | fn-19-react-doctor-cleanup-64-95.10 | — |

## References

- Reporte verbose: `/tmp/rd-verbose.txt` (522 issues con file:line)
- Diagnostics dir: `/var/folders/8b/614494rs6dv7jb4hqyssg70h0000gn/T/react-doctor-1acee320-c24a-4af6-9b4d-b31934bb370a/`
- Pattern canónico mutation: `src/features/inbox/hooks/useMarkInboxItemReadMutation.ts:11-27`
- Pattern WebSocket cleanup: `src/shared/ws/useWebSocket.ts:140-150`
- Theme script falso positivo: `src/routes/__root.tsx:79`
- Playwright fixture falso positivo: `src/test/e2e/fixtures.ts:395`
- TanStack Router redirect: https://tanstack.com/router/latest/docs/framework/react/guide/navigation
- TanStack Query invalidations: https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
- React 19 release notes: https://react.dev/blog/2024/12/05/react-19
- Knip config: https://knip.dev/reference/configuration
- useSyncExternalStore for hydration: https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store
- Tailwind size-N: https://tailwindcss.com/docs/size
- You Might Not Need an Effect: https://react.dev/learn/you-might-not-need-an-effect
