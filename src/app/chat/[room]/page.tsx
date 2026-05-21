'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Send, Globe, Users, X, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

interface Message {
  id: number
  message: string
  original_message: string
  sender_id: number
  sender_username: string
  message_type: string
  created_at: string
}

interface Member {
  id: number
  username: string
  preferred_language: string
  is_online: boolean
  role: string
}

const AVATAR_COLORS = [
  { bg: '#d4af3722', color: '#d4af37' },
  { bg: '#7c3aed22', color: '#9b8fd4' },
  { bg: '#c0587822', color: '#e87da0' },
  { bg: '#6b7c1322', color: '#a3b435' },
  { bg: '#1e40af22', color: '#60a5fa' },
]

const SENDER_COLORS = [
  '#d4af37', '#9b8fd4', '#e87da0', '#a3b435', '#60a5fa',
  '#f97316', '#34d399', '#f43f5e', '#818cf8', '#fb923c',
]

function getSenderColor(name: string) {
  return SENDER_COLORS[name.charCodeAt(0) % SENDER_COLORS.length]
}

function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const { bg, color } = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 500, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {name[0].toUpperCase()}
    </div>
  )
}

export default function ChatRoom() {
  const { room } = useParams()
  const router = useRouter()
  const { user, access } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [roomTitle, setRoomTitle] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [addingUser, setAddingUser] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const roomName = Array.isArray(room) ? room[0] : room
  const isGroup = roomName?.startsWith('group_')

  useEffect(() => {
    if (!user || !access) { router.push('/login'); return }

    if (roomName?.startsWith('dm_')) {
      const otherId = roomName.split('_')[1]
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/${otherId}/`, {
        headers: { Authorization: `Bearer ${access}` }
      })
        .then(r => r.json())
        .then(data => setRoomTitle(data.username))
        .catch(() => setRoomTitle(`User ${otherId}`))
    } else if (roomName?.startsWith('group_')) {
      const groupId = roomName.replace('group_', '')
      api.get(`/api/chat/groups/${groupId}/members/`).then(res => {
        setMembers(res.data)
        const me = res.data.find((m: Member) => m.id === user.id)
        if (me?.role === 'admin') setIsAdmin(true)
      }).catch(() => {})
      api.get('/api/chat/conversations/').then(res => {
        const g = res.data.groups.find((g: any) => g.room_name === roomName)
        setRoomTitle(g?.group?.name || `Group ${groupId}`)
      }).catch(() => setRoomTitle(`Group ${groupId}`))
    }

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/${roomName}/?token=${access}`)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'history') {
        setMessages(data.messages)
      } else if (data.type === 'message') {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message_id)) return prev
          return [...prev, {
            id: data.message_id, message: data.message,
            original_message: data.original_message,
            sender_id: data.sender_id, sender_username: data.sender_username,
            message_type: data.message_type, created_at: data.created_at,
          }]
        })
      }
    }
    return () => ws.close()
  }, [roomName, access])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadAllUsers = async () => {
    const res = await api.get('/api/chat/users/')
    setAllUsers(res.data.filter((u: any) => !members.find(m => m.id === u.id)))
  }

  const handleAddMember = async (userId: number) => {
    const groupId = roomName?.replace('group_', '')
    try {
      await api.post(`/api/chat/groups/${groupId}/add-member/`, { user_id: userId })
      const res = await api.get(`/api/chat/groups/${groupId}/members/`)
      setMembers(res.data)
      setAllUsers(prev => prev.filter(u => u.id !== userId))
    } catch {}
  }

  const handleRemoveMember = async (userId: number) => {
    const groupId = roomName?.replace('group_', '')
    try {
      await api.delete(`/api/chat/groups/${groupId}/remove-member/${userId}/`)
      setMembers(prev => prev.filter(m => m.id !== userId))
    } catch {}
  }

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ type: 'text', message: input.trim() }))
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const isMe = (id: number) => id === user?.id

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', maxWidth: "100%" }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/chat" style={{ color: 'var(--text-muted)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        {isGroup
          ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple-dim)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={16} /></div>
          : <Avatar name={roomTitle || '?'} size={36} />
        }
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{roomTitle || roomName}</p>
          <p style={{ fontSize: 10, color: connected ? 'var(--olive)' : '#e87da0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--olive)' : '#e87da0', display: 'inline-block' }} />
            {connected ? 'Connected' : 'Connecting...'}
            {isGroup && members.length > 0 && <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>{members.length} members</span>}
          </p>
        </div>
        {isGroup ? (
          <button onClick={() => { setShowMembers(!showMembers); if (!showMembers) loadAllUsers() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: showMembers ? 'var(--gold)' : 'var(--text-muted)' }}>
            <Users size={18} />
          </button>
        ) : <Globe size={16} color="var(--text-muted)" />}
      </div>

      {/* Members Panel */}
      {showMembers && isGroup && (
        <div style={{ background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ padding: '8px 14px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gold)' }}>Members</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isAdmin && (
                <button onClick={() => setAddingUser(!addingUser)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: addingUser ? 'var(--pink)' : 'var(--purple)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  {addingUser ? <X size={14} /> : <Plus size={14} />}
                  {addingUser ? 'Cancel' : 'Add'}
                </button>
              )}
              <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {addingUser && isAdmin && (
            <div style={{ maxHeight: 120, overflowY: 'auto', borderBottom: '0.5px solid var(--border)', background: 'var(--bg-tertiary)' }}>
              {allUsers.length === 0
                ? <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-dim)' }}>All users are already members</p>
                : allUsers.map(u => (
                  <button key={u.id} onClick={() => handleAddMember(u.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}>
                    <Avatar name={u.username} size={28} />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{u.username}</span>
                    <Plus size={12} style={{ marginLeft: 'auto', color: 'var(--olive)' }} />
                  </button>
                ))
              }
            </div>
          )}

          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={m.username} size={30} />
                  {m.is_online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: 'var(--olive)', border: '2px solid var(--bg-secondary)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{m.username}</p>
                  <p style={{ fontSize: 10, color: m.role === 'admin' ? 'var(--gold)' : 'var(--text-dim)' }}>
                    {m.role === 'admin' ? '👑 Admin' : 'Member'}
                  </p>
                </div>
                {isAdmin && m.id !== user?.id && (
                  <button onClick={() => handleRemoveMember(m.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pink)', padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <p>No messages yet</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>Say hello! 👋</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={`${msg.id}-${msg.created_at}`} style={{ display: 'flex', justifyContent: isMe(msg.sender_id) ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe(msg.sender_id) ? 'flex-end' : 'flex-start' }}>
              {!isMe(msg.sender_id) && (
                <span style={{ fontSize: 10, color: getSenderColor(msg.sender_username), marginBottom: 3, marginLeft: 4, fontWeight: 600 }}>{msg.sender_username}</span>
              )}
              <div style={{
                padding: '8px 12px', borderRadius: 14,
                borderBottomRightRadius: isMe(msg.sender_id) ? 3 : 14,
                borderBottomLeftRadius: isMe(msg.sender_id) ? 14 : 3,
                background: isMe(msg.sender_id) ? 'var(--bubble-mine)' : 'var(--bubble-theirs)',
                border: isMe(msg.sender_id) ? 'none' : '0.5px solid var(--border)',
              }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{msg.message}</p>
                {msg.original_message && msg.original_message !== msg.message && (
                  <p style={{ fontSize: 10, marginTop: 4, color: 'var(--olive)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Globe size={9} /> {msg.original_message}
                  </p>
                )}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, marginLeft: 4, marginRight: 4 }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '0.5px solid var(--border)' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Type a message..."
          style={{
            flex: 1, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
            borderRadius: 22, padding: '9px 16px', fontSize: 13,
            color: 'var(--text-primary)', outline: 'none',
          }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || !connected}
          style={{
            width: 38, height: 38, borderRadius: '50%', background: input.trim() && connected ? 'var(--gold)' : 'var(--bg-secondary)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s', flexShrink: 0,
          }}>
          <Send size={15} color={input.trim() && connected ? '#1a1a2e' : 'var(--text-dim)'} />
        </button>
      </div>
    </div>
  )
}
