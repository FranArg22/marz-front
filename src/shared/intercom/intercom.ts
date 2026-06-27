/**
 * Wrapper fino sobre el SDK oficial de Intercom (`@intercom/messenger-js-sdk`).
 *
 * El SDK carga el Messenger en el cliente y se marca como instalación
 * `npm-package` (lo que Intercom detecta como "instalado"). Estas funciones se
 * llaman solo en el browser (efectos / handlers). La región define el
 * `api_base`; US para Argentina/LATAM.
 *
 * Opción 2: usuarios identificados, sin verificación de identidad (HMAC).
 */
import {
  Intercom,
  onUnreadCountChange as sdkOnUnreadCountChange,
  show,
  shutdown,
} from '@intercom/messenger-js-sdk'

type IntercomRegion = 'us' | 'eu' | 'ap'

export interface IntercomBootSettings {
  app_id: string
  region?: IntercomRegion
  user_id?: string
  email?: string
  name?: string
  /** Epoch en segundos (no milisegundos). */
  created_at?: number
  hide_default_launcher?: boolean
  /** Separación en px del launcher respecto al borde inferior (default 20). */
  vertical_padding?: number
}

export function bootIntercom(settings: IntercomBootSettings): void {
  Intercom(settings)
}

export function showIntercom(): void {
  show()
}

export function shutdownIntercom(): void {
  shutdown()
}

export function onUnreadCountChange(callback: (count: number) => void): void {
  sdkOnUnreadCountChange(callback)
}
