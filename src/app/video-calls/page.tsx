"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function VideoCallsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/characters') }, [router])
  return null
} 