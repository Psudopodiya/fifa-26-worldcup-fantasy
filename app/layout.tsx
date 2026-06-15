import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FIFA 2026 Fantasy',
  description: 'World Cup 2026 Fantasy League — Pro Mode',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
