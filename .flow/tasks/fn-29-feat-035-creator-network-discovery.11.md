# fn-29-feat-035-creator-network-discovery.11 — Botón "Invitar por email" en /creators + EmailInviteModal

## Description

Agregar el botón "Invitar por email" en la página `/creators` del brand, visible cuando `allows_email_invites = true`. El modal pide email + nota y llama a `useCreateDiscoveryEmailInvite` de `brand.ts`. Manejo de 409 already_pending y validación de email con Zod.

**Size:** S

## Verificación de capability

`allows_email_invites` ya existe en `CampaignPlanCapabilities` (verificado en el generated client). El plan free tiene esta capability habilitada. Leer desde `useMe()` de la misma forma que `allows_discovery` en task .9.

El botón es visible si `allows_email_invites = true`. Si `allows_email_invites = false`, no renderizar el botón (edge case — plan sin email invites).

## Componente: `src/features/discovery/network/components/EmailInviteModal.tsx`

```tsx
import { t } from '@lingui/core/macro'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useCreateDiscoveryEmailInvite } from '#/shared/api/generated/brand/brand'
import { ApiError } from '#/shared/api/mutator'
import { generateIdempotencyKey, withIdempotencyKey } from '#/shared/api/idempotency'

const emailSchema = z.string().email()

interface EmailInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailInviteModal({ open, onOpenChange }: EmailInviteModalProps) {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useCreateDiscoveryEmailInvite({
    mutation: {
      onSuccess: () => {
        toast.success(t`Invitación enviada a ${email}`)
        onOpenChange(false)
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          toast.info(t`Ya existe una invitación pendiente para ese email.`)
        } else if (error instanceof ApiError && error.status === 422) {
          setEmailError(t`El email no es válido.`)
        } else {
          toast.error(t`Algo salió mal. Intentá de nuevo.`)
        }
      },
    },
  })

  function handleSubmit() {
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setEmailError(t`Ingresá un email válido.`)
      return
    }
    setEmailError(null)

    mutation.mutate(
      {
        invited_email: email.trim(),
        note: note.trim() || null,
      },
      // withIdempotencyKey si la mutation generada acepta options como segundo arg
      // Si no, wrapearlo manualmente.
    )
  }

  // Reset al abrir
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEmail('')
      setNote('')
      setEmailError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Invitar por email`}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t`Invitá a un creator que todavía no está en Marz. Le enviaremos un email con el link de registro.`}
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">{t`Email`}</label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
              placeholder="creator@ejemplo.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'invite-email-error' : undefined}
            />
            {emailError && (
              <p id="invite-email-error" className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-note" className="text-sm font-medium">{t`Nota (opcional)`}</label>
            <Textarea
              id="invite-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder={t`Presentate y contale por qué lo estás invitando...`}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/1000</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {t`Cancelar`}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={mutation.isPending || !email}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {t`Enviar invitación`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Nota sobre idempotency**: `useCreateDiscoveryEmailInvite` es una mutation de Orval. Si acepta headers en las options del `mutate()`, pasar `withIdempotencyKey(generateIdempotencyKey())` como segundo argumento. Si no, wrapearlo con `useMutation` + `createDiscoveryEmailInvite` directamente.

## Cambios en `/creators`

**Archivo**: `src/routes/_brand/creators.tsx`

1. Agregar import de `useMe` y el modal.
2. Leer `allows_email_invites` de `useMe()`.
3. Agregar estado `const [emailInviteOpen, setEmailInviteOpen] = useState(false)`.
4. Renderizar botón y modal:

```tsx
{allowsEmailInvites && (
  <>
    <Button type="button" variant="outline" size="sm" onClick={() => setEmailInviteOpen(true)}>
      <Mail className="size-4" aria-hidden />
      {t`Invitar por email`}
    </Button>
    <EmailInviteModal open={emailInviteOpen} onOpenChange={setEmailInviteOpen} />
  </>
)}
```

El botón va en la sección superior de la página (junto a los filtros o el encabezado). Verificar el layout actual de `creators.tsx` para ubicarlo en contexto.

## Acceptance

- [ ] Botón "Invitar por email" visible en `/creators` cuando `allows_email_invites = true`.
- [ ] Modal pide email y nota opcional.
- [ ] Validación de email en cliente antes de llamar la API.
- [ ] En éxito: toast "Invitación enviada a X" + modal se cierra.
- [ ] Error 409 → toast informativo (no error).
- [ ] Error 422 → error inline en el campo email.
- [ ] `pnpm typecheck` verde.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
