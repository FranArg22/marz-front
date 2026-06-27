import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { buildMockCreatorDetailProfile } from '../mocks/creatorDetailProfile'
import type { CreatorProfileSource } from '../mocks/creatorDetailProfile'
import { CreatorProfileSidesheet } from './CreatorProfileSidesheet'

type OpenCreatorProfile = (source: CreatorProfileSource) => void

// Default no-op: el provider va montado en AppShell, pero los componentes que
// usan el hook también se renderizan en tests aislados sin provider. Devolver un
// no-op evita romperlos (el click simplemente no abre nada fuera de la app).
const CreatorProfileSheetContext = createContext<OpenCreatorProfile>(() => {})

/**
 * Monta un único sidesheet de perfil de creador y expone `openCreatorProfile`
 * vía `useCreatorProfileSheet`. Permite abrir el perfil desde cualquier
 * superficie (tablas, inbox, videos, postulaciones…) sin duplicar estado.
 */
export function CreatorProfileSheetProvider({
  children,
}: {
  children: ReactNode
}) {
  const [source, setSource] = useState<CreatorProfileSource | null>(null)
  const [open, setOpen] = useState(false)

  const openCreatorProfile = useCallback<OpenCreatorProfile>((next) => {
    setSource(next)
    setOpen(true)
  }, [])

  const profile = useMemo(
    () => (source ? buildMockCreatorDetailProfile(source) : null),
    [source],
  )

  return (
    <CreatorProfileSheetContext.Provider value={openCreatorProfile}>
      {children}
      <CreatorProfileSidesheet
        profile={profile}
        open={open}
        onOpenChange={setOpen}
      />
    </CreatorProfileSheetContext.Provider>
  )
}

export function useCreatorProfileSheet(): OpenCreatorProfile {
  return useContext(CreatorProfileSheetContext)
}
