import { customFetch } from '#/shared/api/mutator'

// Hand-written client for POST /v1/invites/{token}/accept. Kept out of the
// Orval-generated client because the dev backend spec is currently behind the
// frontend (regenerating the whole client would drop endpoints the app needs).
export interface AcceptInviteByTokenResult {
  connection_request_id: string
  route: string
}

export async function acceptInviteByToken(
  token: string,
): Promise<AcceptInviteByTokenResult> {
  const response = await customFetch<{
    data: AcceptInviteByTokenResult
    status: number
    headers: Headers
  }>(`/v1/invites/${encodeURIComponent(token)}/accept`, { method: 'POST' })
  return response.data
}
