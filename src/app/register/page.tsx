'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Globe, Lock, Mail, User } from 'lucide-react'

const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'ay', name: 'Aymara' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bm', name: 'Bambara' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bho', name: 'Bhojpuri' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'dv', name: 'Dhivehi' },
  { code: 'doi', name: 'Dogri' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'ee', name: 'Ewe' },
  { code: 'fil', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gn', name: 'Guarani' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ilo', name: 'Ilocano' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'gom', name: 'Konkani' },
  { code: 'ko', name: 'Korean' },
  { code: 'kri', name: 'Krio' },
  { code: 'ku', name: 'Kurdish (Kurmanji)' },
  { code: 'ckb', name: 'Kurdish (Sorani)' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ln', name: 'Lingala' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lg', name: 'Luganda' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mai', name: 'Maithili' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mni-Mtei', name: 'Meitei (Manipuri)' },
  { code: 'lus', name: 'Mizo' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'ny', name: 'Nyanja (Chichewa)' },
  { code: 'or', name: 'Odia (Oriya)' },
  { code: 'om', name: 'Oromo' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'qu', name: 'Quechua' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'nso', name: 'Sepedi' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'ts', name: 'Tsonga' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'ak', name: 'Twi (Akan)' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
]

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', username: '', password: '', preferred_language: 'en' })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredLangs = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register/', form)
      setAuth(data.user, data.access, data.refresh)
      toast.success('Account created!')
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#16213e',
    border: '0.5px solid #2a2a4a',
    borderRadius: 12,
    padding: '12px 14px 12px 40px',
    fontSize: 14,
    color: '#e2e2e2',
    outline: 'none',
  }

  const selectedLang = LANGUAGES.find(l => l.code === form.preferred_language)

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#d4af3718', border: '1.5px solid #d4af3744',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <Globe size={24} color="#d4af37" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#d4af37' }}>LinguaDuo</h1>
        <p style={{ fontSize: 12, color: '#9b8fd4', marginTop: 4 }}>Speak in your language. Understand in theirs.</p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#1a1a2e', border: '0.5px solid #2a2a4a',
        borderRadius: 20, padding: '28px 24px',
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#e2e2e2', marginBottom: 4 }}>Create account</h2>
        <p style={{ fontSize: 12, color: '#555', marginBottom: 22 }}>Join LinguaDuo — chat in any language</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={14} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" required style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'} />
          </div>

          {/* Username */}
          <div style={{ position: 'relative' }}>
            <User size={14} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="username" required style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'} />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={14} color="#555" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" required style={inputStyle}
              onFocus={e => e.target.style.border = '0.5px solid #d4af37'}
              onBlur={e => e.target.style.border = '0.5px solid #2a2a4a'} />
          </div>

          {/* Language selector */}
          <div>
            <label style={{ fontSize: 12, color: '#888', marginBottom: 6, display: 'block' }}>
              🌐 My language — {selectedLang?.name}
            </label>
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language..."
              style={{
                width: '100%', background: '#16213e',
                border: '0.5px solid #2a2a4a', borderRadius: '12px 12px 0 0',
                padding: '9px 14px', fontSize: 13, color: '#e2e2e2', outline: 'none',
              }}
            />
            <select
              value={form.preferred_language}
              onChange={e => setForm({ ...form, preferred_language: e.target.value })}
              size={5}
              style={{
                width: '100%', background: '#16213e',
                border: '0.5px solid #2a2a4a', borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                padding: '4px', fontSize: 13, color: '#e2e2e2', outline: 'none',
              }}
            >
              {filteredLangs.map(l => (
                <option key={l.code} value={l.code}
                  style={{ padding: '6px', background: l.code === form.preferred_language ? '#0f3460' : '#16213e' }}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Button */}
          <button type="submit" disabled={loading} style={{
            background: loading ? '#2a2a4a' : '#d4af37',
            color: loading ? '#555' : '#1a1a2e',
            border: 'none', borderRadius: 12,
            padding: '13px 0', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', marginTop: 4,
          }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <div style={{ flex: 1, height: '0.5px', background: '#2a2a4a' }} />
          <span style={{ fontSize: 11, color: '#444' }}>or</span>
          <div style={{ flex: 1, height: '0.5px', background: '#2a2a4a' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#555' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#9b8fd4', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: '#333' }}>
        🌐 130+ languages supported
      </p>
    </div>
  )
}
