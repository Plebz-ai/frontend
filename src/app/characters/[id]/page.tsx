'use client'
import React from 'react'
import { notFound } from 'next/navigation'
import { characterApi, Character } from '../../../lib/api'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import CharacterDetail from '../../../components/character/CharacterDetail'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'
import { FaSpinner } from 'react-icons/fa'

export default function CharacterPage() {
  const params = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const id = params.id as string
        const data = await characterApi.get(id)
        setCharacter(data)
      } catch (error) {
        console.error('Error fetching character:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchCharacter()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070809] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
          <p className="text-gray-400">Loading character...</p>
        </div>
      </div>
    )
  }

  if (!character) {
    return notFound()
  }

  return (
    <ProtectedRoute>
      <div className="h-screen w-full overflow-hidden bg-[#070809]">
        <CharacterDetail character={character} />
      </div>
    </ProtectedRoute>
  )
} 