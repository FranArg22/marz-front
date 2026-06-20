import { t } from '@lingui/core/macro'
import { Vertical } from './types'

/**
 * Etiqueta en minúscula del vertical, para frases tipo "Marcas de {vertical}…".
 * 'other' y desconocidos devuelven undefined para que el caller use un fallback.
 */
export function verticalLabelLower(
  vertical: Vertical | undefined,
): string | undefined {
  switch (vertical) {
    case Vertical.fintech:
      return t`fintech`
    case Vertical.tech:
      return t`tech`
    case Vertical.ecommerce:
      return t`e-commerce`
    case Vertical.education:
      return t`educación`
    case Vertical.food:
      return t`comida`
    case Vertical.fitness:
      return t`fitness`
    case Vertical.health:
      return t`salud`
    case Vertical.entertainment:
      return t`entretenimiento`
    case Vertical.beauty:
      return t`belleza`
    case Vertical.gaming:
      return t`gaming`
    case Vertical.travel:
      return t`viajes`
    case Vertical.fashion:
      return t`moda`
    case Vertical.mobile_apps:
      return t`apps móviles`
    case Vertical.crypto:
      return t`crypto`
    case Vertical.ai_tech:
      return t`AI / tech`
    default:
      return undefined
  }
}
