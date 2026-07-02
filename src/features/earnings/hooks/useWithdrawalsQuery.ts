import { getListMyWithdrawalsQueryKey } from '#/shared/api/generated/creator/creator'

export function getWithdrawalsQueryKey() {
  return getListMyWithdrawalsQueryKey({})
}
