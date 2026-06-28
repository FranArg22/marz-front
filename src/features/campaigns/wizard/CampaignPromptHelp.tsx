import { useEffect, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Check, Copy, Sparkles } from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { CAMPAIGN_PROMPT_TEXT } from './campaignPromptText'

const SEEN_STORAGE_KEY = 'marz_campaign_prompt_seen'
const COPIED_FEEDBACK_MS = 2000

export function CampaignPromptHelp() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mostrar el modal automáticamente la primera vez. Se lee en un efecto para
  // no tocar localStorage durante el render (hidratación segura).
  useEffect(() => {
    if (localStorage.getItem(SEEN_STORAGE_KEY) === null) {
      localStorage.setItem(SEEN_STORAGE_KEY, 'true')
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        clearTimeout(copiedTimeoutRef.current)
      }
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(CAMPAIGN_PROMPT_TEXT)
      setCopied(true)
      if (copiedTimeoutRef.current !== null) {
        clearTimeout(copiedTimeoutRef.current)
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, COPIED_FEEDBACK_MS)
    } catch {
      // Si el clipboard no está disponible, no rompemos el flujo.
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label={t`Ayuda con IA para armar tu campaña`}
            >
              <Sparkles aria-hidden="true" />
              <span className="max-sm:sr-only">
                <Trans>Ayuda con IA</Trans>
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Trans>
              Copiá un prompt para que tu IA te ayude a completar la campaña
            </Trans>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              <Trans>¿Querés ayuda para armar tu campaña?</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                Copiá este prompt y pegalo en tu IA preferida (ChatGPT, Claude,
                etc.). Te va a hacer unas preguntas y darte los campos exactos
                para crear tu campaña en Marz.
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4">
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                {CAMPAIGN_PROMPT_TEXT}
              </pre>
            </div>

            <Button
              type="button"
              onClick={handleCopy}
              className="self-end"
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check aria-hidden="true" />
                  <Trans>Copiado</Trans>
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" />
                  <Trans>Copiar prompt</Trans>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
