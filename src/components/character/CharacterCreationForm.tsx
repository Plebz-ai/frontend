'use client'

import React, { useState, useRef, memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { characterApi } from '../../lib/api'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import InteractiveCharacter from './InteractiveCharacter'

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
  gender: string
  isFiltered: boolean
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  maxLength: number;
  currentLength?: number;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  maxLength: number;
  currentLength?: number;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  maxLength,
  currentLength = 0,
  required = false,
  placeholder = '',
  type = 'text'
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        className="w-full px-4 py-3 bg-[#0d0f16] border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg shadow-sm text-white placeholder-gray-500 transition-all duration-200"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
      />
      {maxLength && (
        <div className="flex justify-end mt-1.5">
          <span className={`text-xs ${currentLength > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  maxLength,
  currentLength = 0,
  required = false,
  placeholder = '',
  rows = 4
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        className="w-full px-4 py-3 bg-[#0d0f16] border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg shadow-sm text-white placeholder-gray-500 transition-all duration-200"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        rows={rows}
      />
      {maxLength && (
        <div className="flex justify-end mt-1.5">
          <span className={`text-xs ${currentLength > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};

const VOICE_TYPES = [
  { value: 'male', label: 'Male', description: 'Human-like voice with male intonation' },
  { value: 'female', label: 'Female', description: 'Human-like voice with female intonation' },
  { value: 'predefined', label: 'Predefined', description: 'Predefined voice' }
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' }
]

export default function CharacterCreationForm() {
  const router = useRouter()
  const { refreshCharacters } = useSidebar()
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
    gender: '',
    avatar: null,
      isFiltered: true
    })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      refreshCharacters()
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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-[#0a0b0e] flex flex-col min-h-screen relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-indigo-600/10 blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-[10%] w-40 h-32 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-20 left-[5%] w-56 h-56 rounded-full bg-purple-600/10 blur-2xl animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute top-2/3 right-20 w-20 h-20 rounded-full bg-indigo-400/15 blur-xl animate-pulse" style={{ animationDuration: '7s' }}></div>
        
        {/* Tech-inspired decorative lines */}
        <div className="absolute top-40 left-20 w-[350px] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent transform -rotate-45"></div>
        <div className="absolute bottom-60 right-40 w-[250px] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent transform rotate-45"></div>
        
        {/* Glowing dots */}
        <div className="absolute top-1/4 left-[15%] w-2 h-2 rounded-full bg-indigo-500/30 shadow-lg shadow-indigo-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-2/3 right-[15%] w-2 h-2 rounded-full bg-blue-400/40 shadow-lg shadow-blue-500/20 animate-ping" style={{ animationDuration: '5s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-purple-500/30 shadow-lg shadow-purple-500/20 animate-ping" style={{ animationDuration: '4s' }}></div>
      </div>
      
      {/* Interactive 3D Character Model */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[400px] h-[800px] pointer-events-auto z-10">
          <div className="w-full h-full overflow-hidden">
            <InteractiveCharacter />
          </div>
        </div>
      </div>
      
      {/* Header */}
      <header className="bg-[#07080a] border-b border-gray-800 py-3 px-6 relative z-10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()} 
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Create Your AI Character</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-5xl w-full mx-auto px-6 py-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-red-900/30 p-4 border border-red-800 mb-4"
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

          <form id="character-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column with avatar upload */}
              <div className="md:col-span-1">
                <div className="flex flex-col items-center">
                  <div 
                    onClick={handleAvatarClick}
                    className="cursor-pointer relative w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden bg-[#0c0d10] border-2 border-gray-800 hover:border-indigo-500 transition-all duration-200 flex items-center justify-center group shadow-lg"
                  >
                    {avatarPreview ? (
                      <Image 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0c0d10] group-hover:bg-[#12141a] transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-600 group-hover:text-indigo-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <h2 className="mt-3 text-lg font-medium text-white">Character Avatar</h2>
                  <p className="text-xs text-gray-400 mt-1 text-center">Upload an image for your character</p>
                </div>
              </div>

              {/* Right column with form fields in 2 columns */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div>
                    <div className="mb-1 flex justify-between items-baseline">
                      <label htmlFor="name" className="block text-gray-300 font-medium">
                        Character Name
                      </label>
                      <span className="text-xs text-gray-500">{formData.name.length}/{limits.name}</span>
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none text-base placeholder-gray-500 transition-all duration-200 shadow-sm"
                      placeholder="e.g. Albert Einstein"
                      required
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <div className="mb-1 flex justify-between items-baseline">
                      <label htmlFor="tagline" className="block text-gray-300 font-medium">
                        Tagline
                      </label>
                      <span className="text-xs text-gray-500">{formData.tagline.length}/{limits.tagline}</span>
                    </div>
                    <input
                      type="text"
                      name="tagline"
                      id="tagline"
                      value={formData.tagline}
                      onChange={handleInputChange}
                      className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none text-base placeholder-gray-500 transition-all duration-200 shadow-sm"
                      placeholder="Add a short tagline for your character"
                      required
                    />
                  </div>

                  {/* Description - spans both columns */}
                  <div className="md:col-span-2">
                    <div className="mb-1 flex justify-between items-baseline">
                      <label htmlFor="description" className="block text-gray-300 font-medium">
                        Description
                      </label>
                      <span className="text-xs text-gray-500">{formData.description.length}/{limits.description}</span>
                    </div>
                    <textarea
                      name="description"
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none text-base placeholder-gray-500 transition-all duration-200 shadow-sm"
                      placeholder="How would your character describe themselves?"
                      required
                    />
                  </div>

                  {/* Personality */}
                  <div>
                    <div className="mb-1 flex justify-between items-baseline">
                      <label htmlFor="personality" className="block text-gray-300 font-medium">
                        Personality Traits
                      </label>
                      <span className="text-xs text-gray-500">{formData.personality.length}/{limits.personality}</span>
                    </div>
                    <input
                      type="text"
                      name="personality"
                      id="personality"
                      value={formData.personality}
                      onChange={handleInputChange}
                      className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none text-base placeholder-gray-500 transition-all duration-200 shadow-sm"
                      placeholder="e.g. curious, witty, compassionate"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <div className="mb-1">
                      <label htmlFor="gender" className="block text-gray-300 font-medium">
                        Gender
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        name="gender"
                        id="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 pr-10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none appearance-none transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Voice */}
                  <div>
                    <div className="mb-1">
                      <label htmlFor="voice_type" className="block text-gray-300 font-medium">
                        Voice
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        name="voice_type"
                        id="voice_type"
                        value={formData.voice_type}
                        onChange={handleInputChange}
                        className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 pr-10 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none appearance-none transition-all duration-200 shadow-sm"
                      >
                        <option value="">Select a voice</option>
                        {VOICE_TYPES.map((voice) => (
                          <option key={voice.value} value={voice.value}>
                            {voice.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Greeting - spans both columns */}
                  <div className="md:col-span-2">
                    <div className="mb-1 flex justify-between items-baseline">
                      <label htmlFor="greeting" className="block text-gray-300 font-medium">
                        Greeting
                      </label>
                      <span className="text-xs text-gray-500">{formData.greeting.length}/{limits.greeting}</span>
                    </div>
                    <textarea
                      name="greeting"
                      id="greeting"
                      rows={3}
                      value={formData.greeting}
                      onChange={handleInputChange}
                      className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none text-base placeholder-gray-500 transition-all duration-200 shadow-sm"
                      placeholder="e.g. Hello, I am Albert. Ask me anything about my scientific contributions."
                      required
                    />
                    
                    <div className="flex flex-wrap gap-x-6 mt-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="dynamicGreetings"
                          name="dynamicGreetings"
                          checked={formData.dynamicGreetings}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 rounded border-gray-700 bg-gray-900"
                        />
                        <label htmlFor="dynamicGreetings" className="ml-2 text-sm text-gray-300 flex items-center">
                          Dynamic greetings
                          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-800 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isFiltered"
                          name="isFiltered"
                          checked={formData.isFiltered}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 rounded border-gray-700 bg-gray-900"
                        />
                        <label htmlFor="isFiltered" className="ml-2 text-sm text-gray-300 flex items-center group relative">
                          Content filter
                          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-800 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-8 bg-gray-800 text-xs text-gray-300 p-1.5 rounded whitespace-nowrap z-10">
                            Filters inappropriate content
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags - spans both columns */}
                  <div className="md:col-span-2">
                    <div className="mb-1">
                      <label htmlFor="tags" className="block text-gray-300 font-medium">
                        Tags
                      </label>
                    </div>
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
                      className="w-full bg-[#0c0d10] text-white border border-gray-800 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none text-base placeholder-gray-500 transition-all duration-200 shadow-sm"
                      placeholder="Add tags to make your character discoverable (comma-separated)"
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit button at the bottom of the form, aligned to the right */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 flex items-center ${
                  isGenerating ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Character'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}