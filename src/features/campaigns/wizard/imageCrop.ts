// Auto-crop centrado a 16:9 para la imagen de campaña (paso 3 del wizard).
// El spec (US-3) define un modal de crop asistido; como MVP el front recorta
// solo al centro y sube el resultado. El backend re-valida ratio y mínimos.

export const CAMPAIGN_IMAGE_RATIO = 16 / 9
export const MIN_CAMPAIGN_IMAGE_WIDTH = 1280
export const MIN_CAMPAIGN_IMAGE_HEIGHT = 720
export const MAX_CAMPAIGN_IMAGE_BYTES = 5 * 1024 * 1024

// Estrictamente más chica que la del backend (image_validator.go: 0.005):
// si el ratio ya está dentro de este margen se sube el original sin
// re-encodear; cualquier cosa fuera se recorta para que el backend la acepte.
const RATIO_TOLERANCE = 0.004

export type ImageCropErrorReason = 'too_small' | 'decode_failed'

export class ImageCropError extends Error {
  readonly reason: ImageCropErrorReason

  constructor(reason: ImageCropErrorReason) {
    super(`campaign.image_crop_${reason}`)
    this.reason = reason
  }
}

export interface CenterCropBox {
  sx: number
  sy: number
  width: number
  height: number
}

export function computeCenterCrop(
  imageWidth: number,
  imageHeight: number,
): CenterCropBox {
  let width = Math.min(
    imageWidth,
    Math.round(imageHeight * CAMPAIGN_IMAGE_RATIO),
  )
  let height = Math.round(width / CAMPAIGN_IMAGE_RATIO)
  if (height > imageHeight) {
    height = imageHeight
    width = Math.min(imageWidth, Math.round(height * CAMPAIGN_IMAGE_RATIO))
  }

  return {
    sx: Math.floor((imageWidth - width) / 2),
    sy: Math.floor((imageHeight - height) / 2),
    width,
    height,
  }
}

export function isWithin16x9Tolerance(width: number, height: number): boolean {
  const ratio = width / height
  return (
    Math.abs(ratio - CAMPAIGN_IMAGE_RATIO) <=
    RATIO_TOLERANCE * CAMPAIGN_IMAGE_RATIO
  )
}

export async function cropImageTo16x9(file: File): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageCropError('decode_failed')
  }

  try {
    const crop = computeCenterCrop(bitmap.width, bitmap.height)
    if (
      crop.width < MIN_CAMPAIGN_IMAGE_WIDTH ||
      crop.height < MIN_CAMPAIGN_IMAGE_HEIGHT
    ) {
      throw new ImageCropError('too_small')
    }

    if (isWithin16x9Tolerance(bitmap.width, bitmap.height)) {
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = crop.width
    canvas.height = crop.height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new ImageCropError('decode_failed')
    }
    context.drawImage(
      bitmap,
      crop.sx,
      crop.sy,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    )

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type, 0.92)
    })
    if (!blob) {
      throw new ImageCropError('decode_failed')
    }

    return new File([blob], file.name, { type: file.type })
  } finally {
    bitmap.close()
  }
}
