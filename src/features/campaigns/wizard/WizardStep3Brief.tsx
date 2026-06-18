import { useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { ImageUp, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  cropImageTo16x9,
  ImageCropError,
  MAX_CAMPAIGN_IMAGE_BYTES,
} from './imageCrop'
import { usePresignImageMutation } from './mutations'
import { useCampaignWizardStore } from './store'

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function isValidTargetUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

export function WizardStep3Brief() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const step3 = useCampaignWizardStore((state) => state.step3)
  const setStep3 = useCampaignWizardStore((state) => state.setStep3)
  const presignImage = usePresignImageMutation()

  const handleImage = async (file: File | undefined) => {
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setImageError(t`Subí una imagen PNG, JPG o WebP.`)
      return
    }

    if (file.size > MAX_CAMPAIGN_IMAGE_BYTES) {
      setImageError(t`La imagen supera el máximo de 5 MB.`)
      return
    }

    setImageError(null)
    try {
      const croppedFile = await cropImageTo16x9(file)
      const presign = await presignImage.mutateAsync({ file: croppedFile })
      setStep3({ imageFile: croppedFile, imageS3Key: presign.s3_key })
    } catch (error) {
      setStep3({ imageFile: null, imageS3Key: null })
      if (error instanceof ImageCropError && error.reason === 'too_small') {
        setImageError(
          t`La imagen es muy chica: el recorte 16:9 necesita al menos 1280×720.`,
        )
      } else {
        setImageError(t`No pudimos subir la imagen. Intentá de nuevo.`)
      }
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const clearImage = () => {
    setImageError(null)
    setStep3({ imageFile: null, imageS3Key: null })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          <Trans>Definí el brief de la campaña</Trans>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          <Trans>
            Completá la información principal que verán los creators antes de
            aplicar.
          </Trans>
        </p>
      </div>

      <div className="grid gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="campaign-name" className="text-sm font-semibold">
            <Trans>Nombre</Trans>
          </label>
          <Input
            id="campaign-name"
            value={step3.name}
            maxLength={150}
            onChange={(event) => setStep3({ name: event.target.value })}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="campaign-description"
            className="text-sm font-semibold"
          >
            <Trans>Descripción</Trans>
          </label>
          <Textarea
            id="campaign-description"
            value={step3.description}
            maxLength={4000}
            className="min-h-32 resize-y break-words"
            onChange={(event) => setStep3({ description: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="campaign-target-url"
            className="text-sm font-semibold"
          >
            <Trans>URL objetivo</Trans>
          </label>
          <Input
            id="campaign-target-url"
            value={step3.target_url}
            maxLength={500}
            placeholder="https://"
            onChange={(event) => setStep3({ target_url: event.target.value })}
            onBlur={(event) => {
              const value = event.target.value.trim()
              if (value !== '' && !/^https?:\/\//i.test(value)) {
                setStep3({ target_url: `https://${value}` })
              }
            }}
          />
          {step3.target_url.trim() !== '' &&
          !isValidTargetUrl(step3.target_url.trim()) ? (
            <p role="alert" className="text-sm text-destructive">
              <Trans>Ingresá una URL válida que empiece con https://</Trans>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">
            <Trans>Imagen</Trans>
          </span>
          {step3.imageFile ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <span className="min-w-0 truncate text-sm font-medium">
                {step3.imageFile.name}
              </span>
              <Button variant="outline" size="sm" onClick={clearImage}>
                <X aria-hidden="true" />
                <Trans>Eliminar</Trans>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-6 text-center hover:bg-surface-hover"
              >
                <ImageUp
                  aria-hidden="true"
                  className="size-6 text-muted-foreground"
                />
                <span className="text-sm font-semibold">
                  <Trans>Subí una imagen de campaña</Trans>
                </span>
                <span className="text-sm text-muted-foreground">
                  <Trans>PNG, JPG o WebP</Trans>
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label={t`Imagen`}
                className="sr-only"
                onChange={(event) => void handleImage(event.target.files?.[0])}
              />
            </div>
          )}
          {imageError ? (
            <p role="alert" className="text-sm text-destructive">
              {imageError}
            </p>
          ) : null}
          {presignImage.isPending ? (
            <p className="text-sm text-muted-foreground">
              <Trans>Subiendo imagen...</Trans>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
