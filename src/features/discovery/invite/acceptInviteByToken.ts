import { acceptInviteByToken as acceptInviteByTokenRequest } from '#/shared/api/generated/creator/creator'
import { ApiError } from '#/shared/api/mutator'
import type { AcceptInviteByTokenResponse } from '#/shared/api/generated/model'

export type AcceptInviteByTokenResult = AcceptInviteByTokenResponse

export async function acceptInviteByToken(
  token: string,
): Promise<AcceptInviteByTokenResult> {
  const response = await acceptInviteByTokenRequest(token)
  if (response.status !== 200) {
     
    throw new ApiError(
      response.status,
      'unexpected_status',
      'Unexpected status',
    )
  }
  return response.data
}
