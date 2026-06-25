import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LinguaDuo',
  description: 'Speak in your language. Understand in theirs.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'LinguaDuo' },
  icons: { icon: '/icon-192x192.png', apple: '/icon-192x192.png' },
}

export const viewport: Viewport = {
  themeColor: '#d4af37',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className} style={{ background: '#0d1117', margin: 0, padding: 0 }}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e2e2e2',
              border: '0.5px solid #2a2a4a',
              fontSize: 13,
            },
          }}
        />
      </body>
    </html>
  )
}
