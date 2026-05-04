import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BrandWorkspaceState {
  activeBrandWorkspaceId: string | null
  setActiveBrandWorkspaceId: (id: string | null) => void
}

export const useBrandWorkspaceStore = create<BrandWorkspaceState>()(
  persist(
    (set) => ({
      activeBrandWorkspaceId: null,
      setActiveBrandWorkspaceId: (id) => set({ activeBrandWorkspaceId: id }),
    }),
    { name: 'marz.brand-workspace' },
  ),
)
