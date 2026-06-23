import { create } from 'zustand'

interface IntercomStoreState {
  /** Mensajes sin leer en el Messenger; alimenta el puntito del tab mobile. */
  unreadCount: number
  setUnreadCount: (count: number) => void
}

export const useIntercomStore = create<IntercomStoreState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}))
