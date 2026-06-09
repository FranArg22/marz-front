import { t } from '@lingui/core/macro'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  createDiscoveryEmailInvite,
  useCreateDiscoveryEmailInvite,
} from '#/shared/api/generated/brand/brand'
import {
  generateIdempotencyKey,
  withIdempotencyKey,
} from '#/shared/api/idempotency'
import { ApiError } from '#/shared/api/mutator'

const emailSchema = z.string().email()

interface EmailInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailInviteModal({
  open,
  onOpenChange,
}: EmailInviteModalProps) {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  function resetForm() {
    setEmail('')
    setNote('')
    setEmailError(null)
  }

  const mutation = useCreateDiscoveryEmailInvite<ApiError>({
    mutation: {
      mutationFn: async ({ data }) => {
        const response = await createDiscoveryEmailInvite(
          data,
          withIdempotencyKey(generateIdempotencyKey()),
        )

        if (response.status !== 201) {
          throw new ApiError(
            response.status,
            'create_email_invite_error',
            'Create email invite failed',
          )
        }

        return response
      },
      onSuccess: (_response, variables) => {
        toast.success(t`Invitación enviada a ${variables.data.invited_email}`)
        resetForm()
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
    mutation.mutate({
      data: {
        invited_email: email.trim(),
        note: note.trim() || null,
      },
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
      mutation.reset()
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
            <label htmlFor="invite-email" className="text-sm font-medium">
              {t`Email`}
            </label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailError(null)
              }}
              placeholder="creator@ejemplo.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'invite-email-error' : undefined}
            />
            {emailError ? (
              <p id="invite-email-error" className="text-xs text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-note" className="text-sm font-medium">
              {t`Nota (opcional)`}
            </label>
            <Textarea
              id="invite-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              placeholder={t`Presentate y contale por qué lo estás invitando...`}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">
              {note.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t`Cancelar`}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || !email}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t`Enviar invitación`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
