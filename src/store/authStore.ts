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
  _hasHydrated: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      _hasHydrated: false,
      setAuth: (user, access, refresh) => set({ user, access, refresh }),
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('linguaduo-auth')
        }
        set({ user: null, access: null, refresh: null })
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'linguaduo-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
