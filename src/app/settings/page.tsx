'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { SUPPORTED_LANGUAGES as LANGUAGES } from '@/lib/languages'
import { ArrowLeft, Save, Trash2, Globe } from 'lucide-react'
import Link from 'next/link'


export default function SettingsPage() {
  const router = useRouter()
  const { user, access, logout, updateUser, _hasHydrated } = useAuthStore()
  const [username, setUsername] = useState('')
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    setUsername(user.username || '')
    setLanguage(user.preferred_language || 'en')
  }, [user, _hasHydrated])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await api.patch('/api/auth/profile/', {
        username,
        preferred_language: language,
      })
      updateUser({ username: res.data.username, preferred_language: res.data.preferred_language })
      setMsg('Saved successfully!')
      setMsgOk(true)
    } catch (err: any) {
      setMsg(err.response?.data?.username?.[0] || err.response?.data?.error || 'Failed to save')
      setMsgOk(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== user?.username) {
      setMsg('Username does not match')
      setMsgOk(false)
      return
    }
    setDeleting(true)
    try {
      await api.delete('/api/auth/delete-account/')
      logout()
      router.push('/login')
    } catch {
      setMsg('Failed to delete account')
      setMsgOk(false)
      setDeleting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e2e2e2' }}>
      {/* Header */}
      <div style={{ background: '#16213e', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '0.5px solid #2a2a4a', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/chat" style={{ color: '#555', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#d4af37' }}>Settings</h1>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

        {/* Profile Section */}
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a4a', padding: '20px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9b8fd4', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Profile</p>

          <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6 }}>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', background: '#0d1117', border: '0.5px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e2e2e2', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Language Section */}
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a4a', padding: '20px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9b8fd4', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={11} /> Preferred Language
          </p>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{ width: '100%', background: '#0d1117', border: '0.5px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e2e2e2', outline: 'none', cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <p style={{ fontSize: 10, color: '#444', marginTop: 8 }}>Messages will be auto-translated to this language</p>
        </div>

        {/* Save Button */}
        {msg && (
          <p style={{ fontSize: 12, color: msgOk ? '#a3b435' : '#e87da0', marginBottom: 12, textAlign: 'center' }}>{msg}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', background: '#d4af37', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24, opacity: saving ? 0.7 : 1 }}
        >
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Delete Account */}
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #e87da030', padding: '20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#e87da0', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Danger Zone</p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              style={{ background: '#e87da015', border: '0.5px solid #e87da040', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#e87da0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Trash2 size={14} /> Delete Account
            </button>
          ) : (
            <>
              <p style={{ fontSize: 12, color: '#e87da0', marginBottom: 10 }}>Type your username <strong>{user?.username}</strong> to confirm:</p>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={user?.username}
                style={{ width: '100%', background: '#0d1117', border: '0.5px solid #e87da040', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e2e2e2', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                  style={{ flex: 1, background: '#2a2a4a', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, color: '#888', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, background: '#e87da0', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
