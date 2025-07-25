'use client'

import React, { useState, useRef } from 'react'
import { characterApi } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface CharacterFormData {
  name: string
  description: string
  personality: string
  background: string
  category: string
  traits: string[]
  goals: string[]
  fears: string[]
  relationships: string[]
  voice_type: string
  voice_gender: string
  voice_style: string
  avatar_url: string
  is_custom: boolean
}

const initialFormData: CharacterFormData = {
  name: '',
  description: '',
  personality: '',
  background: '',
  category: '',
  traits: [],
  goals: [],
  fears: [],
  relationships: [],
  voice_type: '',
  voice_gender: '',
  voice_style: '',
  avatar_url: '',
  is_custom: true,
}

const VOICE_TYPES = [
  { value: '', label: 'Select Voice Type' },
  { value: 'warm', label: 'Warm & Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'calm', label: 'Calm & Soothing' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'humorous', label: 'Humorous' },
]
const VOICE_GENDERS = [
  { value: '', label: 'Select Voice Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'neutral', label: 'Neutral' },
]

export default function CharacterCreationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (field: keyof CharacterFormData, value: string) => {
    if (!value.trim()) return
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] as string[]), value.trim()] }))
  }

  const handleArrayRemove = (field: keyof CharacterFormData, idx: number) => {
    setFormData(prev => ({ ...prev, [field]: (prev[field] as string[]).filter((_, i) => i !== idx) }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, avatar_url: ev.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!formData.name || !formData.description || !formData.personality || !formData.voice_type) {
        setError('Please fill in all required fields.')
        setLoading(false)
        return
      }
      const created = await characterApi.create(formData)
      if (onSuccess) onSuccess()
      setFormData(initialFormData)
      if (created && created.id) {
        router.push(`/characters/${created.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create character')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 bg-[#181a20] rounded-2xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Create Character</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name *</label>
          <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" required />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Personality *</label>
          <input name="personality" value={formData.personality} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">Description *</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" rows={2} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">Background</label>
          <textarea name="background" value={formData.background} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" rows={2} />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Category</label>
          <input name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Voice Type *</label>
          <select name="voice_type" value={formData.voice_type} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" required>
            {VOICE_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Voice Gender</label>
          <select name="voice_gender" value={formData.voice_gender} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white">
            {VOICE_GENDERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Voice Style</label>
          <input name="voice_style" value={formData.voice_style} onChange={handleInputChange} className="w-full p-2 rounded bg-[#23262f] text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Avatar</label>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="w-full" />
          {formData.avatar_url && <img src={formData.avatar_url} alt="Avatar" className="mt-2 w-16 h-16 rounded-full object-cover" />}
        </div>
      </div>
      {/* Array fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['traits', 'goals', 'fears', 'relationships'].map(field => (
          <div key={field}>
            <label className="block text-sm text-gray-300 mb-1 capitalize">{field}</label>
            <div className="flex gap-2 mb-2">
              <input type="text" className="flex-1 p-2 rounded bg-[#23262f] text-white" placeholder={`Add ${field.slice(0, -1)}`} onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleArrayChange(field as keyof CharacterFormData, (e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData[field as keyof CharacterFormData] as string[]).map((item, idx) => (
                <span key={idx} className="bg-teal-700 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  {item}
                  <button type="button" className="ml-1 text-red-400" onClick={() => handleArrayRemove(field as keyof CharacterFormData, idx)}>&times;</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
      <button type="submit" className="w-full mt-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg transition-all" disabled={loading}>
        {loading ? 'Creating...' : 'Create Character'}
      </button>
    </form>
  )
}