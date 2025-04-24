'use client'

import React, { useEffect } from 'react'
import { Inter } from 'next/font/google'
import { usePathname, useRouter } from 'next/navigation'
import './globals.css'
import { AuthProvider, useAuth } from '../lib/auth'
import { SidebarProvider, useSidebar } from '../lib/sidebar-context'
import Navbar from '../components/ui/Navbar'
import Sidebar from '../components/ui/Sidebar'

const inter = Inter({ subsets: ['latin'] })

function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { collapsed } = useSidebar()
  const isLandingPage = pathname === '/'
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname.includes('/forgot-password')
  
  return (
    <>
      {isLandingPage && <Navbar />}
      
      {isLandingPage || isAuthPage ? (
        <main className="min-h-screen">
          {children}
        </main>
      ) : (
        <div className="flex h-full">
          <Sidebar />
          <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[80px]' : 'ml-[340px]'}`}>
            {children}
          </main>
        </div>
      )}
    </>
  )
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Redirect to explore page if user is logged in and on home page
  useEffect(() => {
    if (!isLoading && user && pathname === '/') {
      router.push('/explore')
    }
  }, [isLoading, user, pathname, router])
  
  return (
    <SidebarProvider>
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-[#0a0b0e]">
      <body className={`${inter.className} h-full bg-[#0a0b0e]`}>
        <div className="bg-effect"></div>
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
} 