'use client'

import React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { characterApi } from '../../lib/api'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  description: string
  personality: string
  voice_type: string
}

const VOICE_TYPES = [
  { value: 'natural', label: 'Natural', description: 'Human-like voice with natural intonation' },
  { value: 'robotic', label: 'Robotic', description: 'Mechanical, AI-like voice' },
  { value: 'animated', label: 'Animated', description: 'Expressive, cartoon-like voice' }
]

export default function CharacterCreationForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    personality: '',
    voice_type: 'natural',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)

    try {
      console.log('Submitting character data:', formData)
      const character = await characterApi.create(formData)
      
      console.log('Character created:', character)
      router.push(`/characters/${character.id}`)
    } catch (err) {
      console.error('Error creating character:', err)
      setError('Failed to create character. Please try again.')
      setIsGenerating(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 p-4"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Character Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
              placeholder="e.g. Professor Einstein, Detective Holmes"
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Choose a memorable name that reflects your character's identity
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              name="description"
              id="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
              placeholder="Describe your character's background, expertise, and unique traits..."
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Write a detailed description that brings your character to life
          </p>
        </div>

        <div>
          <label htmlFor="personality" className="block text-sm font-medium text-gray-700">
            Personality Traits
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="personality"
              id="personality"
              value={formData.personality}
              onChange={handleInputChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
              placeholder="e.g. curious, witty, compassionate (comma-separated)"
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            List personality traits that define your character's behavior and interactions
          </p>
        </div>

        <div>
          <label htmlFor="voice_type" className="block text-sm font-medium text-gray-700">
            Voice Type
          </label>
          <div className="mt-1">
            <select
              name="voice_type"
              id="voice_type"
              value={formData.voice_type}
              onChange={handleInputChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            >
              {VOICE_TYPES.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {VOICE_TYPES.find(v => v.value === formData.voice_type)?.description}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isGenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating Your Character...
            </>
          ) : (
            'Create Character'
          )}
        </motion.button>
      </div>
    </form>
  )
} 