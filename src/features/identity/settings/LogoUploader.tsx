import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ImageUp, Trash2 } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { usePresignBrandLogo } from '#/shared/api/generated/identity/identity'

const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp']

interface LogoUploaderProps {
  currentLogoUrl: string | null
  onKeyChange: (key: string | null) => void
  brandName?: string
  error?: string
}

export function LogoUploader({
  currentLogoUrl,
  onKeyChange,
  brandName = '',
  error: serverError,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const presignLogo = usePresignBrandLogo()
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    setPreviewUrl(currentLogoUrl)
  }, [currentLogoUrl])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const initials = useMemo(() => getInitials(brandName), [brandName])
  const hasLogo = Boolean(previewUrl)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError(null)

    try {
      const presignResponse = await presignLogo.mutateAsync({
        data: {
          content_type: file.type,
          content_length: file.size,
        },
      })

      if (presignResponse.status !== 200) {
        setUploadError(t`Error al subir la imagen. Intentá de nuevo.`)
        return
      }

      const uploadResponse = await fetch(presignResponse.data.upload_url, {
        method: 'PUT',
        headers: presignResponse.data.required_headers,
        body: file,
      })

      if (!uploadResponse.ok) {
        setUploadError(t`Error al subir la imagen. Intentá de nuevo.`)
        return
      }

      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
      const nextPreviewUrl = URL.createObjectURL(file)
      setLocalPreviewUrl(nextPreviewUrl)
      setPreviewUrl(nextPreviewUrl)
      onKeyChange(presignResponse.data.s3_key)
    } catch {
      setUploadError(t`Error al subir la imagen. Intentá de nuevo.`)
    }
  }

  function handleRemoveLogo() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      setLocalPreviewUrl(null)
    }
    setPreviewUrl(null)
    setUploadError(null)
    onKeyChange(null)
  }

  const visibleError = uploadError ?? serverError

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        {t`Logo`}
      </span>
      <Avatar className="size-24 rounded-lg border border-border bg-muted">
        {previewUrl ? (
          <AvatarImage
            src={previewUrl}
            alt={t`Logo de marca`}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="rounded-lg text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={presignLogo.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden="true" />
          {presignLogo.isPending ? t`Subiendo...` : t`Subir`}
        </Button>
        {hasLogo ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={presignLogo.isPending}
            onClick={handleRemoveLogo}
          >
            <Trash2 aria-hidden="true" />
            {t`Quitar logo`}
          </Button>
        ) : null}
      </div>

      {visibleError ? (
        <p role="alert" className="text-xs text-destructive">
          {visibleError}
        </p>
      ) : null}
    </div>
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'M'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
