'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import api from '@/lib/api'
import { MessageCircle, Users, LogOut, Globe, Search, Plus, X, UserPlus, UserCheck, UserX, Clock, Copy, Check } from 'lucide-react'

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
  const [tab, setTab] = useState<'chats' | 'users' | 'contacts' | 'groups'>('chats')
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [acceptedContacts, setAcceptedContacts] = useState<any[]>([])
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  const isRoomOpen = pathname !== '/chat'

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) { router.push('/login'); return }
    loadData()
  }, [_hasHydrated, user])

  const loadData = async () => {
    try {
      const [c, u, pending, contacts, invite] = await Promise.all([
        api.get('/api/chat/conversations/'),
        api.get('/api/chat/users/'),
        api.get('/api/contacts/pending/'),
        api.get('/api/contacts/list/'),
        api.get('/api/contacts/invite-link/'),
      ])
      setConvos(c.data)
      setUsers(u.data)
      setPendingRequests(pending.data)
      setAcceptedContacts(contacts.data)
      const token = invite.data.invite_token
      setInviteLink(`${window.location.origin}/invite/${token}`)
    } catch {}
  }

  const handleLogout = () => { logout(); router.push('/login') }

  const handleUserSearch = async (q: string) => {
    setUserSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await api.get(`/api/contacts/search/?q=${encodeURIComponent(q)}`)
      setSearchResults(res.data)
    } catch {} finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (userId: number) => {
    const u = searchResults.find(x => x.id === userId)
    if (!u) return
    try {
      await api.post('/api/contacts/send/', { username: u.username })
      setSearchResults(prev => prev.map(x => x.id === userId ? { ...x, contact_status: 'sent' } : x))
    } catch {}
  }

  const handleRespond = async (contactId: number, action: 'accept' | 'reject') => {
    try {
      await api.post(`/api/contacts/respond/${contactId}/`, { action })
      setPendingRequests(prev => prev.filter(x => x.id !== contactId))
      if (action === 'accept') loadData()
    } catch {}
  }

  const handleRemove = async (contactId: number) => {
    try {
      await api.delete(`/api/contacts/remove/${contactId}/`)
      setAcceptedContacts(prev => prev.filter(x => x.id !== contactId))
    } catch {}
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviteSending(true)
    setInviteMsg('')
    try {
      const res = await api.post('/api/contacts/invite-by-email/', {
        email: inviteEmail.trim(),
        origin: window.location.origin,
      })
      setInviteMsg(res.data.message)
      setInviteEmail('')
    } catch (err: any) {
      setInviteMsg(err.response?.data?.error || 'Failed to send invite')
    } finally {
      setInviteSending(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const allChats = [...convos.dms, ...convos.groups].sort((a, b) =>
    new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  )

  const isActive = (roomName: string) => pathname === `/chat/${roomName}`

  if (!_hasHydrated) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#d4af37', fontSize: 18 }}>Loading...</p>
    </div>
  )

  const Sidebar = (
    <div className="sidebar" style={{ width: '100%', height: '100%', background: '#1a1a2e', borderRight: '0.5px solid #2a2a4a' }}>

      <div style={{ flexShrink: 0, background: '#16213e', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #2a2a4a' }}>
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

      {tab === 'chats' && (
        <div style={{ flexShrink: 0, padding: '8px 12px', background: '#16213e', borderBottom: '0.5px solid #2a2a4a' }}>
          <div style={{ background: '#0d1117', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #2a2a4a' }}>
            <Search size={12} color="#555" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."
              style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e2e2', fontSize: 12, width: '100%' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}><X size={12} /></button>}
          </div>
        </div>
      )}

      <div style={{ flexShrink: 0, display: 'flex', borderBottom: '0.5px solid #2a2a4a' }}>
        {(['chats', 'contacts', 'users', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 0', fontSize: 10, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize',
            color: tab === t ? '#d4af37' : '#555',
            borderBottom: tab === t ? '2px solid #d4af37' : '2px solid transparent',
            position: 'relative',
          }}>
            {t}
            {t === 'contacts' && pendingRequests.length > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 6, background: '#e87da0', color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-list">

        {tab === 'chats' && (
          allChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#444' }}>
              <MessageCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No conversations yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Add contacts to start chatting!</p>
            </div>
          ) : allChats.map(c => {
            const name = c.type === 'dm' ? c.user?.username || '' : c.group?.name || ''
            const active = isActive(c.room_name)
            return (
              <Link key={c.room_name} href={`/chat/${c.room_name}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '0.5px solid #16213e', background: active ? '#0f3460' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
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

        {tab === 'contacts' && (
          <>
            <div style={{ padding: '10px 12px', borderBottom: '0.5px solid #2a2a4a' }}>
              <p style={{ fontSize: 10, color: '#9b8fd4', marginBottom: 6 }}>Invite a friend via link</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: 1, background: '#0d1117', borderRadius: 8, padding: '5px 8px', fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: '0.5px solid #2a2a4a' }}>
                  {inviteLink || 'Loading...'}
                </div>
                <button onClick={handleCopyInvite} style={{ background: copied ? '#a3b43520' : '#d4af3720', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: copied ? '#a3b435' : '#d4af37', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, flexShrink: 0 }}>
                  {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>

              <p style={{ fontSize: 10, color: '#9b8fd4', margin: '10px 0 6px' }}>Or invite by email</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailInvite()}
                  placeholder="friend@email.com"
                  style={{ flex: 1, background: '#0d1117', border: '0.5px solid #2a2a4a', borderRadius: 8, padding: '5px 8px', fontSize: 11, color: '#e2e2e2', outline: 'none' }}
                />
                <button onClick={handleEmailInvite} disabled={inviteSending} style={{ background: '#9b8fd420', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#9b8fd4', fontSize: 10, flexShrink: 0 }}>
                  {inviteSending ? '...' : 'Send'}
                </button>
              </div>
              {inviteMsg && (
                <p style={{ fontSize: 10, marginTop: 6, color: inviteMsg.includes('sent') || inviteMsg.includes('already') || inviteMsg.includes('connected') ? '#a3b435' : '#e87da0' }}>
                  {inviteMsg}
                </p>
              )}
            </div>

            {pendingRequests.length > 0 && (
              <div style={{ borderBottom: '0.5px solid #2a2a4a' }}>
                <p style={{ fontSize: 10, color: '#9b8fd4', padding: '8px 14px 4px', fontWeight: 600 }}>PENDING REQUESTS</p>
                {pendingRequests.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '0.5px solid #16213e' }}>
                    <Avatar name={req.sender.username} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e2e2' }}>{req.sender.username}</p>
                      <p style={{ fontSize: 10, color: '#555' }}>wants to connect</p>
                    </div>
                    <button onClick={() => handleRespond(req.id, 'accept')} style={{ background: '#a3b43520', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#a3b435', display: 'flex' }}>
                      <UserCheck size={14} />
                    </button>
                    <button onClick={() => handleRespond(req.id, 'reject')} style={{ background: '#e87da020', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#e87da0', display: 'flex' }}>
                      <UserX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: 10, color: '#9b8fd4', padding: '8px 14px 4px', fontWeight: 600 }}>MY CONTACTS</p>
            {acceptedContacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#444' }}>
                <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 12 }}>No contacts yet</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Search users or share your invite link!</p>
              </div>
            ) : acceptedContacts.map(c => {
              const contactUser = c.sender.id === user?.id ? c.receiver : c.sender
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '0.5px solid #16213e' }}>
                  <Avatar name={contactUser.username} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e2e2' }}>{contactUser.username}</p>
                  </div>
                  <Link href={`/chat/dm_${contactUser.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{ background: '#60a5fa20', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#60a5fa', fontSize: 10 }}>
                      Chat
                    </button>
                  </Link>
                  <button onClick={() => handleRemove(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', display: 'flex' }}>
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </>
        )}

        {tab === 'users' && (
          <>
            <div style={{ padding: '10px 12px', borderBottom: '0.5px solid #2a2a4a' }}>
              <div style={{ background: '#0d1117', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #2a2a4a' }}>
                <Search size={12} color="#555" />
                <input
                  value={userSearch}
                  onChange={e => handleUserSearch(e.target.value)}
                  placeholder="Search by username..."
                  style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e2e2', fontSize: 12, width: '100%' }}
                />
                {userSearch && <button onClick={() => { setUserSearch(''); setSearchResults([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}><X size={12} /></button>}
              </div>
            </div>

            {userSearch.length < 2 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#444' }}>
                <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 12 }}>Find people on LinguaDuo</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Type at least 2 characters</p>
              </div>
            ) : searching ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#555', fontSize: 12 }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#555', fontSize: 12 }}>No users found</div>
            ) : searchResults.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '0.5px solid #16213e' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={u.username} size={38} />
                  {u.is_online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#a3b435', border: '2px solid #1a1a2e' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e2e2' }}>{u.username}</p>
                  <p style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{LANG_NAMES[u.preferred_language] || u.preferred_language}</p>
                </div>
                {u.contact_status === 'accepted' ? (
                  <span style={{ fontSize: 10, color: '#a3b435', display: 'flex', alignItems: 'center', gap: 3 }}><UserCheck size={12} /> Added</span>
                ) : u.contact_status === 'sent' ? (
                  <span style={{ fontSize: 10, color: '#555', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> Pending</span>
                ) : u.contact_status === 'received' ? (
                  <span style={{ fontSize: 10, color: '#9b8fd4', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> Respond</span>
                ) : (
                  <button onClick={() => handleSendRequest(u.id)} style={{ background: '#d4af3720', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#d4af37', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                    <UserPlus size={12} /> Add
                  </button>
                )}
              </div>
            ))}
          </>
        )}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '0.5px solid #16213e', background: isActive(g.room_name) ? '#0f3460' : 'transparent', cursor: 'pointer' }}
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
        <div className="sidebar-panel" style={{ height: '100vh', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {Sidebar}
        </div>
        <div className="main-panel" style={{ flex: 1, flexDirection: 'column', height: '100vh', minHeight: 0, background: '#0d1117', overflow: 'hidden' }}>
          {isRoomOpen ? children : (
              <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/linguaduo_icon_transparent.svg" alt="LinguaDuo" style={{ width: 120, height: 120, objectFit: "contain", marginBottom: 4 }} />
                <p style={{ fontSize: 16, color: '#333', fontWeight: 500 }}>LinguaDuo</p>
                <p style={{ fontSize: 12, color: '#2a2a4a', marginTop: 6 }}>Select a conversation to start chatting</p>
              </div>
          )}
        </div>
      </div>
    </>
  )
}
