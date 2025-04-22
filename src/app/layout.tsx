'use client'

import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../lib/auth'
import Navbar from '../components/ui/Navbar'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="bg-effect"></div>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
} 