# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# -------- deps: install with frozen lockfile --------
FROM node:${NODE_VERSION} AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# -------- build: compile SSR bundle --------
FROM node:${NODE_VERSION} AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# VITE_* deben estar presentes en build-time (se hornean en el bundle del cliente).
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_TITLE
ARG VITE_CLERK_PUBLISHABLE_KEY
# Opt-in devtools (react-grab) for non-prod builds like the NUC mirror.
# Unset on Vercel → stays out of the real prod bundle.
ARG VITE_DEVTOOLS
# Self-hosted build (node-server): activa el plugin Nitro en vite.config.
# En Vercel esto no se setea → Vercel arma su preset solo.
ARG SELF_HOSTED=1
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_APP_TITLE=$VITE_APP_TITLE \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_DEVTOOLS=$VITE_DEVTOOLS \
    SELF_HOSTED=$SELF_HOSTED
RUN pnpm build

# -------- runner: minimal runtime --------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Only runtime artifacts: built .output + prod node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", ".output/server/index.mjs"]
