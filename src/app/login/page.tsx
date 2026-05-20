'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Globe, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login/', form)
      setAuth(data.user, data.access, data.refresh)
      toast.success('Welcome back!')
      router.push('/')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#16213e',
    border: '0.5px solid #2a2a4a',
    borderRadius: 12,
    padding: '12px 14px 12px 40px',
    fontSize: 14,
    color: '#e2e2e2',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#d4af3718', border: '1.5px solid #d4af3744',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Globe size={28} color="#d4af37" />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#d4af37', letterSpacing: 0.5 }}>LinguaDuo</h1>
        <p style={{ fontSize: 13, color: '#9b8fd4', marginTop: 6 }}>Speak in your language. Understand in theirs.</p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#1a1a2e',
        border: '0.5px solid #2a2a4a',
        borderRadius: 20,
        padding: '32px 28px',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e2e2', marginBottom: 6 }}>Welcome back</h2>
        <p style={{ fontSize: 12, color: '#555', marginBottom: 24 }}>Sign in to continue chatting</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={15} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={15} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'}
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#2a2a4a' : '#d4af37',
              color: loading ? '#555' : '#1a1a2e',
              border: 'none', borderRadius: 12,
              padding: '13px 0', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', marginTop: 4,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#2a2a4a' }} />
          <span style={{ fontSize: 11, color: '#444' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#2a2a4a' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#555' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#9b8fd4', fontWeight: 500, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 11, color: '#333' }}>
        🌐 Supports 15+ languages with real-time translation
      </p>
    </div>
  )
}
