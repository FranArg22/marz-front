import { defineConfig } from 'vite'
// @tanstack/devtools-vite disabled: causes infinite SSR↔client log echo loop.
// Re-enable after upstream fix lands.

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'

import viteReact from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'

const sentryOrg = process.env.SENTRY_ORG ?? 'marz-lc'
const sentryProject =
  process.env.SENTRY_PROJECT ?? 'javascript-tanstackstart-react'
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

const config = defineConfig({
  server: {
    allowedHosts: ['marz.test', 'marz-front.test', 'marz-codex.test'],
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$',
      },
    }),
    // Nitro genera la salida de servidor y autoelige preset por env:
    // - Vercel (VERCEL=1) → preset vercel (.vercel/output con la función SSR).
    // - self-hosted (SELF_HOSTED=1, NUC) → node-server (.output/server).
    // Sin el plugin no hay build de servidor → Vercel da 404. En `vite dev`
    // (ninguno de los dos) se omite para no alterar el dev server.
    ...(process.env.SELF_HOSTED || process.env.VERCEL ? [nitro()] : []),
    viteReact({
      plugins: [['@lingui/swc-plugin', {}]],
    }),
    lingui(),
    // Sentry plugin uploads sourcemaps during build and deletes them from the
    // bundle afterwards. Only active when SENTRY_AUTH_TOKEN is provided.
    ...(sentryAuthToken
      ? [
          sentryTanstackStart({
            org: sentryOrg,
            project: sentryProject,
            authToken: sentryAuthToken,
          }),
        ]
      : []),
  ],
})

export default config
