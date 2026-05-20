'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { ArrowLeft, Check, Users } from 'lucide-react'
import Link from 'next/link'

const AVATAR_COLORS = [
  { bg: '#d4af3722', color: '#d4af37' },
  { bg: '#7c3aed22', color: '#9b8fd4' },
  { bg: '#c0587822', color: '#e87da0' },
  { bg: '#6b7c1322', color: '#a3b435' },
  { bg: '#1e40af22', color: '#60a5fa' },
]
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function CreateGroupPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isStudyGroup, setIsStudyGroup] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    api.get('/api/chat/users/').then(res => setAllUsers(res.data)).catch(() => {})
  }, [user])

  const toggleUser = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required.'); return }
    if (selectedIds.length === 0) { setError('Add at least one member.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/chat/groups/create/', {
        name: name.trim(), description, is_study_group: isStudyGroup, member_ids: selectedIds,
      })
      router.push(`/chat/group_${res.data.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create group.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13,
    color: 'var(--text-primary)', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '0.5px solid var(--border)' }}>
        <Link href="/chat" style={{ color: 'var(--text-muted)', display: 'flex' }}><ArrowLeft size={20} /></Link>
        <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--gold)' }}>Create Group</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Group info */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 16, border: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--gold)', marginBottom: 4 }}>Group Info</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name *" style={inputStyle} />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" style={inputStyle} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={isStudyGroup} onChange={e => setIsStudyGroup(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--gold)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📚 Mark as Study Group</span>
          </label>
        </div>

        {/* Member selection */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '0.5px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={13} /> Add Members
            </p>
            <span style={{ fontSize: 11, color: 'var(--purple)' }}>{selectedIds.length} selected</span>
          </div>
          {allUsers.map(u => {
            const { bg, color } = getAvatarColor(u.username)
            const selected = selectedIds.includes(u.id)
            return (
              <button key={u.id} onClick={() => toggleUser(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: selected ? 'var(--bg-hover)' : 'none', border: 'none', borderBottom: '0.5px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500 }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{u.username}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.preferred_language}</p>
                </div>
                {selected && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={13} color="#1a1a2e" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && <p style={{ color: 'var(--pink)', fontSize: 13, textAlign: 'center' }}>{error}</p>}

        <button onClick={handleCreate} disabled={loading}
          style={{ background: 'var(--gold)', color: '#1a1a2e', border: 'none', borderRadius: 22, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {loading ? 'Creating...' : '🚀 Create Group'}
        </button>
      </div>
    </div>
  )
}
