'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Send, Globe, Users, X, Plus, Trash2, Copy, CornerUpLeft, Check } from 'lucide-react'
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

interface ContextMenu {
  x: number
  y: number
  msg: Message
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
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

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
    setReplyTo(null)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const isMe = (id: number) => id === user?.id

  // Copy message text
  const handleCopy = useCallback((msg: Message) => {
    const text = msg.message
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msg.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
    setContextMenu(null)
  }, [])

  // Private reply — navigate to DM with quoted text pre-filled
  const handlePrivateReply = useCallback((msg: Message) => {
    setContextMenu(null)
    if (isMe(msg.sender_id)) return // can't DM yourself
    setReplyTo(msg)
    // If already in a DM with this person, just pre-fill; if in group, navigate to DM
    const dmRoom = `dm_${msg.sender_id}`
    if (roomName !== dmRoom) {
      // Navigate to DM room carrying the reply text via sessionStorage
      sessionStorage.setItem('replyQuote', JSON.stringify({
        sender: msg.sender_username,
        text: msg.message,
      }))
      router.push(`/chat/${dmRoom}`)
    } else {
      // Already in DM — just set reply bar
      setReplyTo(msg)
      inputRef.current?.focus()
    }
  }, [roomName, router])

  // Context menu on right-click (desktop)
  const handleContextMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, msg })
  }, [])

  // Long press (mobile)
  const handleTouchStart = useCallback((msg: Message) => {
    longPressTimer.current = setTimeout(() => {
      // Show context menu at center-ish
      setContextMenu({ x: window.innerWidth / 2 - 70, y: window.innerHeight / 2 - 40, msg })
    }, 500)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  // On load, check if there's a pending reply quote (from group → DM navigation)
  useEffect(() => {
    if (!roomName?.startsWith('dm_')) return
    const raw = sessionStorage.getItem('replyQuote')
    if (raw) {
      try {
        const q = JSON.parse(raw)
        setInput(`"${q.text}" `)
        sessionStorage.removeItem('replyQuote')
        setTimeout(() => inputRef.current?.focus(), 300)
      } catch {}
    }
  }, [roomName])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', maxWidth: "100%", position: 'relative' }}>

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
          <div
            key={`${msg.id}-${msg.created_at}`}
            style={{ display: 'flex', justifyContent: isMe(msg.sender_id) ? 'flex-end' : 'flex-start' }}
            onContextMenu={(e) => handleContextMenu(e, msg)}
            onTouchStart={() => handleTouchStart(msg)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
          >
            <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe(msg.sender_id) ? 'flex-end' : 'flex-start' }}>
              {!isMe(msg.sender_id) && (
                <span style={{ fontSize: 10, color: getSenderColor(msg.sender_username), marginBottom: 3, marginLeft: 4, fontWeight: 600 }}>{msg.sender_username}</span>
              )}
              <div style={{
                padding: '8px 12px', borderRadius: 14,
                borderBottomRightRadius: isMe(msg.sender_id) ? 3 : 14,
                borderBottomLeftRadius: isMe(msg.sender_id) ? 14 : 3,
                background: isMe(msg.sender_id) ? '#1a3a5c' : '#1e1e2e',
                border: isMe(msg.sender_id) ? '0.5px solid #2a5a8a' : '0.5px solid var(--border)',
                position: 'relative',
              }}>
                {/* copied flash */}
                {copiedId === msg.id && (
                  <div style={{
                    position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--olive)', color: '#0d1117', fontSize: 10, padding: '2px 8px',
                    borderRadius: 10, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Check size={9} /> Copied!
                  </div>
                )}
                <p style={{ fontSize: 13, color: isMe(msg.sender_id) ? '#c8e0f8' : 'var(--text-primary)', lineHeight: 1.5 }}>{msg.message}</p>
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

      {/* Reply bar (when replying privately in DM) */}
      {replyTo && (
        <div style={{
          background: 'var(--bg-secondary)', borderTop: '0.5px solid var(--border)',
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1, borderLeft: '3px solid var(--gold)', paddingLeft: 8 }}>
            <p style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>
              Replying to {replyTo.sender_username}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
              {replyTo.message}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '0.5px solid var(--border)' }}>
        <input
          ref={inputRef}
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder={replyTo ? `Reply to ${replyTo.sender_username}...` : 'Type a message...'}
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, window.innerHeight - 100),
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            background: '#1e1e2e',
            border: '0.5px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 100,
            minWidth: 150,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={() => handleCopy(contextMenu.msg)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '11px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', fontSize: 13,
              borderBottom: !isMe(contextMenu.msg.sender_id) ? '0.5px solid var(--border)' : 'none',
            }}
          >
            <Copy size={14} color="var(--blue)" /> Copy
          </button>
          {!isMe(contextMenu.msg.sender_id) && isGroup && (
            <button
              onClick={() => handlePrivateReply(contextMenu.msg)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '11px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-primary)', fontSize: 13,
              }}
            >
              <CornerUpLeft size={14} color="var(--gold)" /> Reply Privately
            </button>
          )}
        </div>
      )}
    </div>
  )
}
