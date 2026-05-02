'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import Link from 'next/link'
import { MessageCircle, Users, LogOut, Globe } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-indigo-600 text-xl animate-pulse">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">LinguaDuo</h1>
          <p className="text-indigo-200 text-xs flex items-center gap-1">
            <Globe size={12} />
            {LANG_NAMES[user?.preferred_language || 'en']}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-indigo-200">{user?.username}</span>
          <button onClick={handleLogout} className="text-indigo-200 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b">
        {(['chats', 'users', 'groups'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition ${tab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'chats' && (
          <div>
            {allChats.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Go to Users tab to start chatting!</p>
              </div>
            ) : allChats.map((c) => (
              <Link key={c.room_name} href={`/chat/${c.room_name}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border-b hover:bg-gray-50 transition">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                  {c.type === 'dm' ? c.user?.username[0].toUpperCase() : c.group?.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {c.type === 'dm' ? c.user?.username : c.group?.name}
                    </span>
                    {c.last_message_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{c.last_message || 'No messages yet'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div className="p-3 bg-white border-b">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {filteredUsers.map((u) => (
              <Link key={u.id} href={`/chat/dm_${u.id}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border-b hover:bg-gray-50 transition">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {u.username[0].toUpperCase()}
                  </div>
                  {u.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{u.username}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Globe size={10} /> {LANG_NAMES[u.preferred_language] || u.preferred_language}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'groups' && (
          <div>
            <div className="p-3 bg-white border-b">
              <Link href="/chat/create-group"
                className="block w-full bg-indigo-600 text-white text-center py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
                + Create Study Group
              </Link>
            </div>
            {convos.groups.map((g) => (
              <Link key={g.room_name} href={`/chat/${g.room_name}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border-b hover:bg-gray-50 transition">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{g.group?.name}</p>
                  <p className="text-xs text-gray-400">{g.group?.is_study_group ? '📚 Study Group' : '💬 Group'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
