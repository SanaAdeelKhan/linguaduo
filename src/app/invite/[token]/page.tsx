'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Globe, UserPlus, Check, X, LogIn } from 'lucide-react'

export default function InvitePage() {
  const { token } = useParams()
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleAccept = async () => {
    setStatus('loading')
    try {
      const res = await api.post('/api/contacts/accept-invite/', { token })
      setMessage(res.data.message)
      setStatus('success')
      setTimeout(() => router.push('/chat'), 2000)
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Something went wrong')
      setStatus('error')
    }
  }

  if (!_hasHydrated) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#d4af37' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#16213e', border: '0.5px solid #2a2a4a', borderRadius: 16, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#d4af3715', border: '1.5px solid #d4af3730', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Globe size={28} color="#d4af37" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37', marginBottom: 8 }}>LinguaDuo</h1>
        <p style={{ fontSize: 14, color: '#9b8fd4', marginBottom: 28 }}>You've been invited to connect!</p>

        {!user ? (
          <div>
            <p style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>Please log in or create an account to accept this invite.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => router.push(`/login?next=/invite/${token}`)} style={{ background: '#d4af37', color: '#1a1a2e', border: 'none', borderRadius: 24, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogIn size={14} /> Log In
              </button>
              <button onClick={() => router.push(`/register?next=/invite/${token}`)} style={{ background: '#9b8fd420', color: '#9b8fd4', border: '0.5px solid #9b8fd440', borderRadius: 24, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Sign Up
              </button>
            </div>
          </div>
        ) : status === 'success' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#a3b435', fontSize: 14 }}>
            <Check size={18} /> {message}
          </div>
        ) : status === 'error' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#e87da0', fontSize: 14, marginBottom: 16 }}>
              <X size={18} /> {message}
            </div>
            <button onClick={() => router.push('/chat')} style={{ background: '#60a5fa20', color: '#60a5fa', border: 'none', borderRadius: 24, padding: '10px 24px', fontSize: 13, cursor: 'pointer' }}>
              Go to Chat
            </button>
          </div>
        ) : (
          <button onClick={handleAccept} disabled={status === 'loading'} style={{ background: '#d4af37', color: '#1a1a2e', border: 'none', borderRadius: 24, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
            <UserPlus size={16} />
            {status === 'loading' ? 'Connecting...' : 'Accept Invite'}
          </button>
        )}
      </div>
    </div>
  )
}
