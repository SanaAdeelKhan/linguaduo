'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Globe, Lock, Mail } from 'lucide-react'

const GOOGLE_CLIENT_ID = '711955586340-1vnqlc4apdgr4obpa923as3b7ij185kv.apps.googleusercontent.com'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email verified! You can now log in.')
    }
  }, [searchParams])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        })
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          { theme: 'filled_black', size: 'large', shape: 'pill', width: 344, text: 'continue_with' }
        )
      }
    }
    document.body.appendChild(script)
  }, [])

  const handleGoogleLogin = async (response: any) => {
    try {
      const { data } = await api.post('/api/auth/google-login/', { id_token: response.credential })
      setAuth(data.user, data.access, data.refresh)
      toast.success(data.is_new_user ? 'Welcome to LinguaDuo! 🎉' : 'Welcome back!')
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Google login failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setShowResend(false)
    try {
      const { data } = await api.post('/api/auth/login/', form)
      setAuth(data.user, data.access, data.refresh)
      toast.success('Welcome back!')
      const next = searchParams.get('next')
      router.push(next || '/')
    } catch (err: any) {
      const error = err.response?.data
      if (err.response?.status === 403 && error?.resend) {
        toast.error('Please verify your email first!')
        setShowResend(true)
      } else {
        toast.error(error?.error || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/api/auth/resend-verification/', { email: form.email })
      toast.success('Verification email sent! Check your inbox.')
    } catch {
      toast.error('Could not resend. Try again.')
    } finally {
      setResending(false)
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
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/linguaduo_brandmark.svg" 
          alt="LinguaDuo" 
          style={{ width: 260, height: 'auto', objectFit: "contain" }} 
        />
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        background: '#1a1a2e', border: '0.5px solid #2a2a4a',
        borderRadius: 20, padding: '32px 28px',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e2e2', marginBottom: 6 }}>Welcome back</h2>
        <p style={{ fontSize: 12, color: '#555', marginBottom: 24 }}>Sign in to continue chatting</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={15} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" required style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'} />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={15} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" required style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'} />
          </div>

          {showResend && (
            <div style={{
              background: '#1a0f00', border: '0.5px solid #d4af3744',
              borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#d4af37',
            }}>
              ⚠️ Email not verified.{' '}
              <button type="button" onClick={handleResend} disabled={resending}
                style={{ color: '#9b8fd4', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#2a2a4a' : '#d4af37',
            color: loading ? '#555' : '#1a1a2e',
            border: 'none', borderRadius: 12,
            padding: '13px 0', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', marginTop: 4,
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#2a2a4a' }} />
          <span style={{ fontSize: 11, color: '#444' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#2a2a4a' }} />
        </div>

        <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }} />

        <p style={{ textAlign: 'center', fontSize: 13, color: '#555' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#9b8fd4', fontWeight: 500, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: '#333' }}>
        🌐 Supports 130+ languages with real-time translation
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d1117' }} />}>
      <LoginForm />
    </Suspense>
  )
}
