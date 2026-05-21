'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import api from '@/lib/api'
import { MessageCircle, Users, LogOut, Globe, Search, Plus, X } from 'lucide-react'

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
  pt: 'Portuguese', it: 'Italian', bn: 'Bengali', pa: 'Punjabi',
  fa: 'Persian', sw: 'Swahili', ta: 'Tamil', te: 'Telugu',
}

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

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, _hasHydrated } = useAuthStore()
  const [convos, setConvos] = useState<{ dms: Conversation[]; groups: Conversation[] }>({ dms: [], groups: [] })
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'chats' | 'users' | 'groups'>('chats')

  const isRoomOpen = pathname !== '/chat'

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    loadData()
  }, [_hasHydrated, user])

  const loadData = async () => {
    try {
      const [c, u] = await Promise.all([
        api.get('/api/chat/conversations/'),
        api.get('/api/chat/users/'),
      ])
      setConvos(c.data)
      setUsers(u.data)
    } catch {}
  }

  const handleLogout = () => { logout(); router.push('/login') }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const allChats = [...convos.dms, ...convos.groups].sort((a, b) =>
    new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  )

  const isActive = (roomName: string) => pathname === `/chat/${roomName}`

  // Show loading until hydrated
  if (!_hasHydrated) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#d4af37', fontSize: 18 }}>Loading...</p>
    </div>
  )

  const Sidebar = (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#1a1a2e', borderRight: '0.5px solid #2a2a4a',
    }}>
      {/* Header */}
      <div style={{ background: '#16213e', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #2a2a4a' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#d4af37' }}>LinguaDuo</h1>
          <p style={{ fontSize: 10, color: '#9b8fd4', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Globe size={10} /> {LANG_NAMES[user?.preferred_language || 'en'] || user?.preferred_language}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{user?.username}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', background: '#16213e', borderBottom: '0.5px solid #2a2a4a' }}>
        <div style={{ background: '#0d1117', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #2a2a4a' }}>
          <Search size={12} color="#555" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e2e2', fontSize: 12, width: '100%' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}><X size={12} /></button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #2a2a4a' }}>
        {(['chats', 'users', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 0', fontSize: 11, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize',
            color: tab === t ? '#d4af37' : '#555',
            borderBottom: tab === t ? '2px solid #d4af37' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'chats' && (
          allChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#444' }}>
              <MessageCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No conversations yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Go to Users to start chatting!</p>
            </div>
          ) : allChats.map(c => {
            const name = c.type === 'dm' ? c.user?.username || '' : c.group?.name || ''
            const active = isActive(c.room_name)
            return (
              <Link key={c.room_name} href={`/chat/${c.room_name}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderBottom: '0.5px solid #16213e',
                  background: active ? '#0f3460' : 'transparent', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#16213e' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Avatar name={name} isGroup={c.type === 'group'} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e2e2' }}>{name}</span>
                      {c.last_message_at && (
                        <span style={{ fontSize: 10, color: '#444' }}>
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#555', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.last_message || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        )}

        {tab === 'users' && filteredUsers.map(u => (
          <Link key={u.id} href={`/chat/dm_${u.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderBottom: '0.5px solid #16213e',
              background: isActive(`dm_${u.id}`) ? '#0f3460' : 'transparent', cursor: 'pointer',
            }}
              onMouseEnter={e => { if (!isActive(`dm_${u.id}`)) e.currentTarget.style.background = '#16213e' }}
              onMouseLeave={e => { if (!isActive(`dm_${u.id}`)) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar name={u.username} size={38} />
                {u.is_online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#a3b435', border: '2px solid #1a1a2e' }} />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e2e2' }}>{u.username}</p>
                <p style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                  {LANG_NAMES[u.preferred_language] || u.preferred_language}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {tab === 'groups' && (
          <>
            <Link href="/chat/create-group" style={{ textDecoration: 'none' }}>
              <div style={{ margin: '10px 12px', background: '#d4af37', borderRadius: 20, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={13} color="#1a1a2e" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>Create Group</span>
              </div>
            </Link>
            {convos.groups.map(g => (
              <Link key={g.room_name} href={`/chat/${g.room_name}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderBottom: '0.5px solid #16213e',
                  background: isActive(g.room_name) ? '#0f3460' : 'transparent', cursor: 'pointer',
                }}
                  onMouseEnter={e => { if (!isActive(g.room_name)) e.currentTarget.style.background = '#16213e' }}
                  onMouseLeave={e => { if (!isActive(g.room_name)) e.currentTarget.style.background = 'transparent' }}
                >
                  <Avatar name={g.group?.name || 'G'} isGroup size={38} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e2e2' }}>{g.group?.name}</p>
                    <p style={{ fontSize: 10, color: '#555', marginTop: 1 }}>
                      {g.role === 'admin' ? '👑 Admin' : '👤 Member'}
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

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .sidebar-panel { display: flex !important; width: 300px !important; min-width: 300px !important; flex-shrink: 0; }
          .main-panel { display: flex !important; flex: 1 !important; min-width: 0 !important; overflow: hidden; }
        }
        @media (max-width: 767px) {
          .sidebar-panel { display: ${isRoomOpen ? 'none' : 'flex'} !important; width: 100% !important; }
          .main-panel { display: ${isRoomOpen ? 'flex' : 'none'} !important; width: 100% !important; }
        }
      `}</style>

      <div style={{ height: '100vh', background: '#0d1117', display: 'flex', overflow: 'hidden' }}>
        <div className="sidebar-panel" style={{ height: '100vh', flexDirection: 'column' }}>
          {Sidebar}
        </div>
        <div className="main-panel" style={{ flex: 1, flexDirection: 'column', height: '100vh', background: '#0d1117' }}>
          {isRoomOpen ? children : (
            <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d4af3710', border: '1.5px solid #d4af3730', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Globe size={36} color="#d4af3744" />
              </div>
              <p style={{ fontSize: 16, color: '#333', fontWeight: 500 }}>LinguaDuo</p>
              <p style={{ fontSize: 12, color: '#2a2a4a', marginTop: 6 }}>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
