'use client'

import React, { useState, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { characterApi } from '../../lib/api'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface FormData {
  name: string
  tagline: string
  description: string
  greeting: string
  dynamicGreetings: boolean
  personality: string
  voice_type: string
  tags: string[]
  avatar?: File | null
}

interface InputFieldProps {
  name: string
  value: string
  placeholder: string
  limit: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const InputField = memo(({ 
  name, 
  value, 
  placeholder, 
  limit, 
  onChange 
}: InputFieldProps) => (
  <div className="relative w-full">
    <input
      type="text"
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="w-full bg-[#1e1e24] text-white border-0 py-3 px-4 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-base placeholder-gray-500"
      placeholder={placeholder}
      required
    />
    <div className="absolute top-3 right-4 text-xs text-gray-500">
      {value.length}/{limit}
    </div>
  </div>
));

InputField.displayName = 'InputField';

interface TextAreaFieldProps {
  name: string 
  value: string
  placeholder: string
  limit: number
  rows?: number
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const TextAreaField = memo(({ 
  name, 
  value, 
  placeholder, 
  limit, 
  rows = 4,
  onChange 
}: TextAreaFieldProps) => (
  <div className="relative w-full">
    <textarea
      name={name}
      id={name}
      rows={rows}
      value={value}
      onChange={onChange}
      className="w-full bg-[#1e1e24] text-white border-0 py-3 px-4 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-base placeholder-gray-500"
      placeholder={placeholder}
      required
    />
    <div className="absolute top-3 right-4 text-xs text-gray-500">
      {value.length}/{limit}
    </div>
  </div>
));

TextAreaField.displayName = 'TextAreaField';

const VOICE_TYPES = [
  { value: 'natural', label: 'Natural', description: 'Human-like voice with natural intonation' },
  { value: 'robotic', label: 'Robotic', description: 'Mechanical, AI-like voice' },
  { value: 'animated', label: 'Animated', description: 'Expressive, cartoon-like voice' }
]

export default function CharacterCreationForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    tagline: '',
    description: '',
    greeting: '',
    dynamicGreetings: false,
    personality: '',
    voice_type: '',
    tags: [],
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Character count limits
  const limits = {
    name: 20,
    tagline: 50,
    description: 500,
    greeting: 2048,
    personality: 100
  }

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
    
    // Check character limits
    if (name in limits && value.length > limits[name as keyof typeof limits]) {
      return
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData(prev => ({ ...prev, avatar: file }))
      
      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-[#1f1c26] rounded-xl shadow-lg">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-900/50 p-4 border border-red-700 mb-6"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-200">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="space-y-6">
        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-6">
          <div 
            onClick={handleAvatarClick}
            className="cursor-pointer relative w-24 h-24 rounded-full overflow-hidden bg-[#2b303b] mb-2 flex items-center justify-center"
          >
            {avatarPreview ? (
              <Image 
                src={avatarPreview} 
                alt="Avatar preview" 
                fill 
                className="object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          <h3 className="text-white font-medium text-center">Character name</h3>
        </div>

        {/* Name field */}
        <InputField 
          name="name"
          value={formData.name}
          placeholder="e.g. Albert Einstein"
          limit={limits.name}
          onChange={handleInputChange}
        />

        {/* Tagline */}
        <div>
          <label htmlFor="tagline" className="block text-white mb-2">
            Tagline
          </label>
          <InputField 
            name="tagline"
            value={formData.tagline}
            placeholder="Add a short tagline of your Character"
            limit={limits.tagline}
            onChange={handleInputChange}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-white mb-2">
            Description
          </label>
          <TextAreaField 
            name="description"
            value={formData.description}
            placeholder="How would your Character describe themselves?"
            limit={limits.description}
            onChange={handleInputChange}
          />
        </div>

        {/* Personality */}
        <div>
          <label htmlFor="personality" className="block text-white mb-2">
            Personality Traits
          </label>
          <InputField 
            name="personality"
            value={formData.personality}
            placeholder="e.g. curious, witty, compassionate (comma-separated)"
            limit={100}
            onChange={handleInputChange}
          />
        </div>

        {/* Greeting */}
        <div>
          <label htmlFor="greeting" className="block text-white mb-2">
            Greeting
          </label>
          <TextAreaField 
            name="greeting"
            value={formData.greeting}
            placeholder="e.g. Hello, I am Albert. Ask me anything about my scientific contributions."
            limit={limits.greeting}
            onChange={handleInputChange}
          />
          
          <div className="mt-3 flex items-center">
            <input
              type="checkbox"
              id="dynamicGreetings"
              name="dynamicGreetings"
              checked={formData.dynamicGreetings}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
            />
            <label htmlFor="dynamicGreetings" className="ml-2 text-white flex items-center">
              Allow dynamic greetings
              <span className="ml-1 inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </label>
          </div>
        </div>

        {/* Voice */}
        <div>
          <label htmlFor="voice_type" className="block text-white mb-2">
            Voice
          </label>
          <div className="relative">
            <select
              name="voice_type"
              id="voice_type"
              value={formData.voice_type}
              onChange={handleInputChange}
              className="block w-full bg-[#1e1e24] text-white border-0 py-3 px-4 pr-10 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none"
            >
              <option value="">Select a voice</option>
              {VOICE_TYPES.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-white mb-2">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            value={formData.tags.join(', ')}
            onChange={(e) => {
              // Split by commas and trim whitespace
              const tagArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
              setFormData(prev => ({ ...prev, tags: tagArray }));
            }}
            className="w-full bg-[#1e1e24] text-white border-0 py-3 px-4 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-base placeholder-gray-500"
            placeholder="Add tags to make your character discoverable (comma-separated)"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className={`px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-md ${
            isGenerating ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          disabled={isGenerating}
        >
          {isGenerating ? 'Creating Character...' : 'Create Character'}
        </button>
      </div>
    </form>
  )
} 