export const CLERK_SECRET = process.env.CLERK_SECRET_KEY
export const CLERK_API_URL = 'https://api.clerk.com/v1'
export const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')
export const E2E_RUN_ID =
  process.env.E2E_RUN_ID ?? `${Date.now().toString(36)}${process.pid}`
