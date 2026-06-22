import { useInboxQuery } from './useInboxQuery'

/**
 * Indica si el inbox tiene items pendientes (sección "Pendientes"), para
 * mostrar el puntito de notificación sobre el ícono de inbox en el shell.
 * Reusa la query de inbox, que ya pollea cada 30s.
 */
export function useInboxActionBadge(): boolean {
  const query = useInboxQuery()
  return (query.data?.counts.action_items ?? 0) > 0
}
