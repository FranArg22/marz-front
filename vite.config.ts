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
    allowedHosts: ['marz.test', 'marz-front.test'],
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        routeFileIgnorePattern: '\\.(test|spec)\\.(ts|tsx)$',
      },
    }),
    // Vercel (prod) detecta TanStack Start y arma su preset Nitro solo.
    // En self-hosted (NUC, node-server) no hay auto-detección → activar el
    // plugin explícitamente sólo cuando SELF_HOSTED=1 (lo setea el build Docker).
    ...(process.env.SELF_HOSTED ? [nitro()] : []),
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
