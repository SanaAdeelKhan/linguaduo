'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import Link from 'next/link'
import { MessageCircle, Users, LogOut, Globe, Search, Plus } from 'lucide-react'

interface Conversation {
  type: 'dm' | 'group'
  room_name: string
  last_message: string
  last_message_at: string
  user?: { id: number; username: string; is_online: boolean; preferred_language: string }
  group?: { id: number; name: string; description: string; is_study_group: boolean }
  role?: string
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', ar: 'Arabic', fr: 'French', de: 'German',
  es: 'Spanish', ur: 'Urdu', hi: 'Hindi', zh: 'Chinese',
  ja: 'Japanese', ko: 'Korean', tr: 'Turkish', ru: 'Russian',
  pt: 'Portuguese', it: 'Italian', bn: 'Bengali',
}

const AVATAR_COLORS = [
  { bg: 'var(--gold-dim)', color: 'var(--gold)' },
  { bg: 'var(--purple-dim)', color: 'var(--purple)' },
  { bg: 'var(--pink-dim)', color: 'var(--pink)' },
  { bg: 'var(--olive-dim)', color: 'var(--olive)' },
  { bg: 'var(--blue-dim)', color: 'var(--blue)' },
]

function getAvatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

function Avatar({ name, isGroup = false, size = 42 }: { name: string; isGroup?: boolean; size?: number }) {
  const { bg, color } = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 500, fontSize: size * 0.35,
      flexShrink: 0,
    }}>
      {isGroup ? <Users size={size * 0.4} /> : name[0].toUpperCase()}
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [convos, setConvos] = useState<{ dms: Conversation[]; groups: Conversation[] }>({ dms: [], groups: [] })
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'chats' | 'users' | 'groups'>('chats')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [c, u] = await Promise.all([
        api.get('/api/chat/conversations/'),
        api.get('/api/chat/users/'),
      ])
      setConvos(c.data)
      setUsers(u.data)
    } catch {}
    setLoading(false)
  }

  const handleLogout = () => { logout(); router.push('/login') }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const allChats = [...convos.dms, ...convos.groups].sort((a, b) =>
    new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ color: 'var(--gold)', fontSize: 18 }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--gold)' }}>LinguaDuo</h1>
          <p style={{ fontSize: 11, color: 'var(--purple)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={11} /> {LANG_NAMES[user?.preferred_language || 'en']}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.username}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 20, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '0.5px solid var(--border)' }}>
          <Search size={14} color="var(--text-dim)" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border)' }}>
        {(['chats', 'users', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize',
            color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Chats Tab */}
        {tab === 'chats' && (
          allChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <MessageCircle size={44} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No conversations yet</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Go to Users tab to start chatting!</p>
            </div>
          ) : allChats.map(c => {
            const name = c.type === 'dm' ? c.user?.username || '' : c.group?.name || ''
            return (
              <Link key={c.room_name} href={`/chat/${c.room_name}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
                  background: 'var(--bg-secondary)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                >
                  <Avatar name={name} isGroup={c.type === 'group'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>
                      {c.last_message_at && (
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.last_message || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        )}

        {/* Users Tab */}
        {tab === 'users' && filteredUsers.map(u => (
          <Link key={u.id} href={`/chat/dm_${u.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
              background: 'var(--bg-secondary)', cursor: 'pointer',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            >
              <div style={{ position: 'relative' }}>
                <Avatar name={u.username} size={42} />
                {u.is_online && (
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: 'var(--olive)', border: '2px solid var(--bg-secondary)' }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{u.username}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe size={10} /> {LANG_NAMES[u.preferred_language] || u.preferred_language}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {/* Groups Tab */}
        {tab === 'groups' && (
          <>
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border)' }}>
              <Link href="/chat/create-group" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'var(--gold)', color: '#1a1a2e', borderRadius: 20,
                  padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  <Plus size={15} /> Create Group
                </div>
              </Link>
            </div>
            {convos.groups.map(g => (
              <Link key={g.room_name} href={`/chat/${g.room_name}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
                  background: 'var(--bg-secondary)', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                >
                  <Avatar name={g.group?.name || 'G'} isGroup size={42} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{g.group?.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {g.group?.is_study_group ? '📚 Study Group' : '💬 Group'} · {g.role === 'admin' ? '👑 Admin' : 'Member'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
