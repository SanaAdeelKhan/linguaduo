import { create } from 'zustand'

interface UnreadState {
  counts: Record<string, number>
  setAll: (counts: Record<string, number>) => void
  increment: (roomName: string) => void
  clear: (roomName: string) => void
  total: () => number
}

export const useUnreadStore = create<UnreadState>()((set, get) => ({
  counts: {},
  setAll: (counts) => set({ counts }),
  increment: (roomName) => set((state) => ({
    counts: { ...state.counts, [roomName]: (state.counts[roomName] || 0) + 1 }
  })),
  clear: (roomName) => set((state) => {
    if (!state.counts[roomName]) return state
    const next = { ...state.counts }
    delete next[roomName]
    return { counts: next }
  }),
  total: () => Object.values(get().counts).reduce((a, b) => a + b, 0),
}))
