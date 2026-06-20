import { Trans } from '@lingui/react/macro'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { storePendingInviteToken } from '#/features/discovery/invite/pendingInvite'
import { useGetEmailInviteByToken } from '#/shared/api/generated/discovery/discovery'

export const Route = createFileRoute('/invite/$token')({
  component: InviteLandingPage,
})

function InviteLandingPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const inviteQuery = useGetEmailInviteByToken(token)

  if (inviteQuery.isPending) {
    return <InviteShell>{null}</InviteShell>
  }

  const response = inviteQuery.data
  const invite = response?.status === 200 ? response.data : null

  if (!invite || invite.status === 'expired') {
    return (
      <InviteShell>
        <InviteCard
          title={<Trans>Esta invitación ya no está disponible</Trans>}
          description={
            <Trans>
              El link expiró o no es válido. Pedile a la marca que te envíe uno
              nuevo.
            </Trans>
          }
        />
      </InviteShell>
    )
  }

  const brandName = invite.brand_workspace.name
  const acceptInvite = () => {
    storePendingInviteToken(token)
    void navigate({ to: '/auth' })
  }

  return (
    <InviteShell>
      <InviteCard
        logoUrl={invite.brand_workspace.logo_url}
        brandName={brandName}
        title={<Trans>{brandName} te invitó a Marz</Trans>}
        description={
          invite.note ? (
            <span className="italic">“{invite.note}”</span>
          ) : (
            <Trans>
              {brandName} quiere conectar con vos. Creá tu cuenta de creador y
              empezá la conversación.
            </Trans>
          )
        }
        action={
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={acceptInvite}
          >
            <Trans>Unirme a Marz</Trans>
          </Button>
        }
      />
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-start justify-center">
        <div
          className="h-[500px] w-[600px] -translate-y-3/4 rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent), transparent)',
          }}
        />
      </div>
      <div className="relative flex min-h-screen items-center justify-center p-6">
        {children}
      </div>
    </main>
  )
}

function InviteCard({
  logoUrl,
  brandName,
  title,
  description,
  action,
}: {
  logoUrl?: string | null
  brandName?: string
  title: React.ReactNode
  description: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={brandName ?? ''}
          width={56}
          height={56}
          className="size-14 rounded-xl border border-border object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="w-full">{action}</div> : null}
    </div>
  )
}
