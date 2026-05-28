export type WorkspacePlan = 'free' | 'starter' | 'growth' | 'scale'

export function getWorkspacePlan(plan: string | undefined): WorkspacePlan {
  if (plan === 'starter' || plan === 'growth' || plan === 'scale') {
    return plan
  }

  return 'free'
}
