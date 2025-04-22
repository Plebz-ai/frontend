'use client'

import React, { useState } from 'react'
import { Character } from '../../lib/api'
import CharacterChat from './CharacterChat'
import VideoCall from '../video-call/VideoCall'
import { motion } from 'framer-motion'
import { FaPhone, FaInfoCircle } from 'react-icons/fa'

interface CharacterDetailProps {
  character: Character
}

export default function CharacterDetail({ character }: CharacterDetailProps) {
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat')

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {isVideoCallActive && (
        <VideoCall 
          character={character} 
          onClose={() => setIsVideoCallActive(false)} 
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{character.name}</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVideoCallActive(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <FaPhone className="mr-2 h-4 w-4" />
            Video Call
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">About</h2>
                    <p className="mt-2 text-gray-600">{character.description}</p>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Personality</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {character.personality.split(',').map((trait, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          {trait.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Voice Type</h2>
                    <p className="mt-2 text-gray-600 capitalize">{character.voice_type}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
              <div className="sm:hidden">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-4 px-4 text-center font-medium ${
                      activeTab === 'chat'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-4 px-4 text-center font-medium ${
                      activeTab === 'info'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Info
                  </button>
                </div>
              </div>

              <div className="p-6 h-full">
                {/* Mobile Info Panel (shown when activeTab is 'info') */}
                {activeTab === 'info' && (
                  <div className="sm:hidden">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">About</h2>
                        <p className="mt-2 text-gray-600">{character.description}</p>
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Personality</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {character.personality.split(',').map((trait, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                            >
                              {trait.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Voice Type</h2>
                        <p className="mt-2 text-gray-600 capitalize">{character.voice_type}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Component (shown on desktop or when activeTab is 'chat') */}
                {(activeTab === 'chat' || window.innerWidth >= 640) && (
                  <div className="h-[600px] flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 hidden sm:block">
                      Chat with {character.name}
                    </h2>
                    <div className="flex-1">
                      <CharacterChat character={character} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 