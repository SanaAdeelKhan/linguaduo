'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Send, Globe, Users } from 'lucide-react'
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

  useEffect(() => {
    if (!user || !access) { router.push('/login'); return }

    if (roomName?.startsWith('dm_')) {
      const parts = roomName.split('_')
      const otherId = parts.find(p => p !== String(user.id) && p !== 'dm')
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/${otherId}/`, {
        headers: { Authorization: `Bearer ${access}` }
      })
        .then(r => r.json())
        .then(data => setRoomTitle(`@${data.username}`))
        .catch(() => setRoomTitle(`@user ${otherId}`))
    } else if (roomName?.startsWith('group_')) {
      const groupId = roomName.replace('group_', '')
      // Fetch group members to get group name + member list
      api.get(`/api/chat/groups/${groupId}/members/`)
        .then(res => {
          setMembers(res.data)
          const me = res.data.find((m: Member) => m.id === user.id)
          if (me?.role === 'admin') setIsAdmin(true)
        })
        .catch(() => {})
      // Fetch group name from conversations
      api.get('/api/chat/conversations/')
        .then(res => {
          const group = res.data.groups.find((g: any) => g.room_name === roomName)
          if (group?.group?.name) setRoomTitle(group.group.name)
          else setRoomTitle(`Group ${groupId}`)
        })
        .catch(() => setRoomTitle(`Group ${groupId}`))
    } else {
      setRoomTitle(roomName || '')
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
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message_id)) return prev
          return [...prev, {
            id: data.message_id,
            message: data.message,
            original_message: data.original_message,
            sender_id: data.sender_id,
            sender_username: data.sender_username,
            message_type: data.message_type,
            created_at: data.created_at,
          }]
        })
      }
    }

    return () => ws.close()
  }, [roomName, access])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const isMe = (senderId: number) => senderId === user?.id
  const isGroup = roomName?.startsWith('group_')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="text-indigo-200 hover:text-white">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1">
          <h2 className="font-semibold">{roomTitle || roomName}</h2>
          <p className="text-xs text-indigo-200 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Connected' : 'Connecting...'}
            {isGroup && members.length > 0 && (
              <span className="ml-2">{members.length} members</span>
            )}
          </p>
        </div>
        {isGroup && (
          <button onClick={() => { setShowMembers(!showMembers); if (!showMembers) loadAllUsers() }}
            className="text-indigo-200 hover:text-white">
            <Users size={20} />
          </button>
        )}
        {!isGroup && <Globe size={18} className="text-indigo-200" />}
      </div>

      {/* Members Panel */}
      {showMembers && isGroup && (
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Members</span>
            {isAdmin && (
              <button onClick={() => setAddingUser(!addingUser)}
                className="text-xs text-indigo-600 font-medium hover:underline">
                {addingUser ? 'Cancel' : '+ Add Member'}
              </button>
            )}
          </div>

          {/* Add member dropdown */}
          {addingUser && isAdmin && (
            <div className="px-4 py-2 border-b bg-indigo-50">
              <p className="text-xs text-gray-500 mb-2">Select user to add:</p>
              {allUsers.length === 0
                ? <p className="text-xs text-gray-400">All users are already members</p>
                : allUsers.map(u => (
                  <button key={u.id} onClick={() => handleAddMember(u.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-indigo-100 rounded text-sm">
                    <span className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {u.username[0].toUpperCase()}
                    </span>
                    {u.username}
                  </button>
                ))
              }
            </div>
          )}

          {/* Member list */}
          <div className="max-h-40 overflow-y-auto">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {m.username[0].toUpperCase()}
                  </div>
                  {m.is_online && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{m.username}</p>
                  <p className="text-xs text-gray-400">{m.role === 'admin' ? '👑 Admin' : 'Member'}</p>
                </div>
                {isAdmin && m.id !== user?.id && (
                  <button onClick={() => handleRemoveMember(m.id)}
                    className="text-xs text-red-400 hover:text-red-600">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={`${msg.id}-${msg.created_at}`} className={`flex ${isMe(msg.sender_id) ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md flex flex-col ${isMe(msg.sender_id) ? 'items-end' : 'items-start'}`}>
              {!isMe(msg.sender_id) && (
                <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender_username}</span>
              )}
              <div className={`px-4 py-2 rounded-2xl ${isMe(msg.sender_id)
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'}`}>
                <p className="text-sm">{msg.message}</p>
                {msg.original_message && msg.original_message !== msg.message && (
                  <p className={`text-xs mt-1 ${isMe(msg.sender_id) ? 'text-indigo-200' : 'text-gray-400'}`}>
                    🌐 {msg.original_message}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1 mx-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3 flex items-center gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={sendMessage} disabled={!input.trim() || !connected}
          className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
