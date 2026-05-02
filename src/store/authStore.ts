import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  username: string
  preferred_language: string
  is_online: boolean
}

interface AuthState {
  user: User | null
  access: string | null
  refresh: string | null
  setAuth: (user: User, access: string, refresh: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      setAuth: (user, access, refresh) => set({ user, access, refresh }),
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
      logout: () => set({ user: null, access: null, refresh: null }),
    }),
    { name: 'linguaduo-auth' }
  )
)
