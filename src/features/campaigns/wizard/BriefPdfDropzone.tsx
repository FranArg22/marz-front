import { useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { FileText, Upload, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { track } from '#/shared/analytics/track'
import { usePresignBriefPdfMutation } from './mutations'
import { useCampaignWizardStore } from './store'

const MAX_BRIEF_PDF_BYTES = 10 * 1024 * 1024

type PdfRejectedReason = 'size' | 'type'

export function BriefPdfDropzone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const briefPdfFile = useCampaignWizardStore(
    (state) => state.step6.briefPdfFile,
  )
  const setStep6 = useCampaignWizardStore((state) => state.setStep6)
  const presignBriefPdf = usePresignBriefPdfMutation()

  const reject = (reason: PdfRejectedReason, message: string) => {
    setError(message)
    track('campaign_wizard_pdf_rejected', { reason })
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      reject('type', t`Solo podés subir un archivo PDF.`)
      return
    }

    if (file.size > MAX_BRIEF_PDF_BYTES) {
      reject('size', t`El PDF no puede superar los 10 MB.`)
      return
    }

    setError(null)
    try {
      const presign = await presignBriefPdf.mutateAsync({ file })
      setStep6({ briefPdfFile: file, briefPdfS3Key: presign.s3_key })
    } catch {
      setStep6({ briefPdfFile: null, briefPdfS3Key: null })
      setError(t`No pudimos subir el PDF. Intentá de nuevo.`)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const clearFile = () => {
    setError(null)
    setStep6({ briefPdfFile: null, briefPdfS3Key: null })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  if (briefPdfFile) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <FileText aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {briefPdfFile.name}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={clearFile}>
          <X aria-hidden="true" />
          <Trans>Eliminar</Trans>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          void handleFile(event.dataTransfer.files[0])
        }}
        className={cn(
          'flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-6 text-center transition-colors hover:bg-surface-hover',
          error && 'border-destructive',
        )}
      >
        <Upload aria-hidden="true" className="size-6 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          <Trans>Subí el PDF del brief</Trans>
        </span>
        <span className="text-sm text-muted-foreground">
          <Trans>PDF opcional, hasta 10 MB</Trans>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        aria-label={t`PDF del brief`}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {presignBriefPdf.isPending ? (
        <p className="text-sm text-muted-foreground">
          <Trans>Subiendo PDF...</Trans>
        </p>
      ) : null}
    </div>
  )
}
