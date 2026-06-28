'use client'
export const dynamic = 'force-dynamic'
// src/app/sso-entry/page.tsx
// Route: /sso-entry?token=xxx&refresh=yyy&with_id=123
// GazaBridge frontend redirects here after getting LD tokens from GB backend

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function SSOEntry() {
  const router = useRouter()
  const params = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const access = params.get('token')
    const refresh = params.get('refresh')
    const withId = params.get('with_id')   // LD user ID to open DM with
    const userRaw = params.get('user')     // JSON-encoded user object

    if (!access || !userRaw) {
      router.replace('/login')
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw))

      // Set auth exactly as LD's own login does
      setAuth(user, access, refresh || '')

      // Clean tokens from URL immediately (security)
      window.history.replaceState({}, '', '/sso-entry')

      // Redirect to DM or chat list
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
