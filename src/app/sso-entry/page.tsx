'use client'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function SSOEntry() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const access = params.get('token')
    const refresh = params.get('refresh')
    const withId = params.get('with_id')
    const userRaw = params.get('user')

    if (!access || !userRaw) {
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw))
      setAuth(user, access, refresh || '')
      window.history.replaceState({}, '', '/sso-entry')

      if (withId) {
        router.replace(`/chat/dm_${withId}`)
      } else {
        router.replace('/chat')
      }
    } catch {
      router.replace('/login')
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-muted)',
      fontSize: 14,
    }}>
      Opening LinguaDuo...
    </div>
  )
}
