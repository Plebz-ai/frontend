'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import VideoCall from '../../../components/video-call/VideoCall'
import { characterApi } from '../../../lib/api'

export default function VideoCallPage() {
  const params = useParams()
  const [character, setCharacter] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const data = await characterApi.get(params.id as string)
        setCharacter(data)
      } catch (err) {
        setError('Failed to load character')
        console.error('Error fetching character:', err)
      }
    }

    if (params.id) {
      fetchCharacter()
    }
  }, [params.id])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-8">
            Video Call with {character.name}
          </h1>
          <VideoCall character={character} />
        </div>
      </div>
    </div>
  )
} 