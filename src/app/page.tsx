'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Globe } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (!_hasHydrated) return
    if (user) {
      router.push('/chat')
    } else {
      router.push('/login')
    }
  }, [_hasHydrated, user, router])

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#d4af3718', border: '1.5px solid #d4af3744',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Globe size={28} color="#d4af37" />
      </div>
      <p style={{ color: '#d4af37', fontSize: 24, fontWeight: 700 }}>LinguaDuo</p>
      <p style={{ color: '#555', fontSize: 13 }}>Loading...</p>
    </div>
  )
}
