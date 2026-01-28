import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SOW Builder',
  description: 'Interactive Statement of Work Builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
