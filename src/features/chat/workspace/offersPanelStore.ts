import { create } from 'zustand'

interface OffersPanelState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useOffersPanelStore = create<OffersPanelState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))
