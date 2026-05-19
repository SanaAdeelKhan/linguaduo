'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { ArrowLeft, Users, Check } from 'lucide-react'
import Link from 'next/link'

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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required.'); return }
    if (selectedIds.length === 0) { setError('Add at least one member.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/chat/groups/create/', {
        name: name.trim(),
        description,
        is_study_group: isStudyGroup,
        member_ids: selectedIds,
      })
      router.push(`/chat/group_${res.data.id}`)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create group.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="text-indigo-200 hover:text-white">
          <ArrowLeft size={22} />
        </Link>
        <h2 className="font-semibold">Create Group</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Group name */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Group Info</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name *"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isStudyGroup} onChange={e => setIsStudyGroup(e.target.checked)}
              className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-600">📚 Mark as Study Group</span>
          </label>
        </div>

        {/* Member selection */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users size={16} /> Add Members
            </h3>
            <span className="text-xs text-indigo-600 font-medium">{selectedIds.length} selected</span>
          </div>
          {allUsers.map(u => (
            <button key={u.id} onClick={() => toggleUser(u.id)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 border-b transition text-left">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{u.username}</p>
                <p className="text-xs text-gray-400">{u.preferred_language}</p>
              </div>
              {selectedIds.includes(u.id) && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button onClick={handleCreate} disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
          {loading ? 'Creating...' : '🚀 Create Group'}
        </button>
      </div>
    </div>
  )
}
