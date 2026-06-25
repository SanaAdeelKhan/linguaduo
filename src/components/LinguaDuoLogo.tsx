import { Globe } from 'lucide-react'

interface LinguaDuoLogoProps {
  size?: number
  showName?: boolean
  nameSize?: number
}

export default function LinguaDuoLogo({ size = 20, showName = false, nameSize = 18 }: LinguaDuoLogoProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ position: "relative", display: "inline-flex", width: size + 4, height: size + 4 }}>
        <Globe size={size} color="#4a90d9" />
        <svg
          width={size * 0.5}
          height={size * 0.45}
          viewBox="0 0 12 10"
          fill="none"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: "absolute", bottom: 0, right: 0 }}
        >
          <rect x="0" y="0" width="12" height="7.5" rx="1.5" stroke="#d4af37" fill="#0f172a"/>
          <path d="M3 7.5 L2 10 L6 7.5" stroke="#d4af37" fill="#d4af37"/>
        </svg>
      </span>
      {showName && (
        <span style={{ fontSize: nameSize, fontWeight: 700 }}>
          <span style={{ color: '#d4af37' }}>Lingua</span>
          <span style={{ color: '#ffffff' }}>Duo</span>
        </span>
      )}
    </span>
  )
}
