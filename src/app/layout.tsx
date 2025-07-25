import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { SidebarProvider } from '@/lib/sidebar-context'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aletheia - AI Platform',
  description: 'Create, interact, and connect with AI characters through voice, video, and chat. Experience conversations that feel truly human.',
  keywords: 'AI, artificial intelligence, voice chat, video call, character creation, chatbot',
  authors: [{ name: 'Aletheia Team' }],
  openGraph: {
    title: 'Aletheia - AI Platform',
    description: 'Create, interact, and connect with AI characters through voice, video, and chat.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aletheia - AI Platform',
    description: 'Create, interact, and connect with AI characters through voice, video, and chat.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 