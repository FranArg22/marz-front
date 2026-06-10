import { t } from '@lingui/core/macro'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Textarea } from '#/components/ui/textarea'
import type {
  DiscoveryCreatorCard,
  GetDiscoveryCreatorsParams,
} from '#/shared/api/generated/model'
import { DiscoveryCreatePairKindEnum } from '#/shared/api/generated/model'

import { useCreateConnectionRequestMutation } from '../hooks/useCreateConnectionRequestMutation'

interface InviteSingleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: DiscoveryCreatorCard | null
  appliedParams: Omit<GetDiscoveryCreatorsParams, 'cursor' | 'limit'>
}

export function InviteSingleModal({
  open,
  onOpenChange,
  card,
  appliedParams,
}: InviteSingleModalProps) {
  const [note, setNote] = useState('')
  const wasOpenRef = useRef(false)
  const submitLockedRef = useRef(false)
  const mutation = useCreateConnectionRequestMutation(appliedParams)
  const { isPending, isSuccess, mutate, reset } = mutation
  const pairState = card?.pair_state
  const name = card?.display_name ?? ''

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setNote('')
      submitLockedRef.current = false
      reset()
    }
    wasOpenRef.current = open
  }, [open, reset])

  useEffect(() => {
    if (isSuccess) {
      onOpenChange(false)
    }
  }, [isSuccess, onOpenChange])

  function handleSubmit() {
    if (!card || isPending || submitLockedRef.current) return

    submitLockedRef.current = true

    mutate(
      {
        creator_account_id: card.account_id,
        note: note.trim() || null,
      },
      {
        onSettled: () => {
          submitLockedRef.current = false
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t`Invitar a ${name}`}</DialogTitle>
        </DialogHeader>

        {pairState?.kind === DiscoveryCreatePairKindEnum.connection_rejected ||
        pairState?.kind === DiscoveryCreatePairKindEnum.connection_expired ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {pairState.kind === DiscoveryCreatePairKindEnum.connection_rejected
              ? t`Este creator rechazó una invitación anterior. Podés volver a intentarlo.`
              : t`Una invitación anterior venció. Podés volver a intentarlo.`}
          </div>
        ) : null}

        {card ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Avatar className="size-11 shrink-0">
              <AvatarImage src={card.avatar_url} alt={card.display_name} />
              <AvatarFallback>
                {card.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {card.display_name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {card.country}
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="invite-note" className="text-sm font-medium">
            {t`Nota (opcional)`}
          </label>
          <Textarea
            id="invite-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder={t`Contale por qué querés trabajar con este creator...`}
            rows={4}
          />
          <p className="text-right text-xs text-muted-foreground">
            {note.length}/1000
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t`Cancelar`}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!card || isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t`Enviar invitación`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
