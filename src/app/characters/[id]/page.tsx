'use client'
import React from 'react'
import { notFound } from 'next/navigation'
import { characterApi, Character } from '../../../lib/api'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import CharacterChat from '../../../components/character/CharacterChat'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'

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
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!character) {
    return notFound()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
              {character.name}
            </h1>

            <div className="bg-white shadow-xl rounded-lg overflow-hidden p-6 mb-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Description</h2>
                  <p className="mt-1 text-gray-600">{character.description}</p>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900">Personality</h2>
                  <p className="mt-1 text-gray-600">{character.personality}</p>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900">Voice Type</h2>
                  <p className="mt-1 text-gray-600">{character.voice_type}</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">
              Chat with {character.name}
            </h2>
            <CharacterChat character={character} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 