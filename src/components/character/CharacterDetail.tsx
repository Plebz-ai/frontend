'use client'

import React, { useState, useEffect } from 'react'
import { Character } from '../../lib/api'
import CharacterChat from './CharacterChat'
import VideoCall from '../video-call/VideoCall'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPhone, FaInfoCircle, FaTimes, FaCaretDown, FaCaretUp, FaVideo, FaEllipsisV } from 'react-icons/fa'
import Image from 'next/image'

interface CharacterDetailProps {
  character: Character
}

export default function CharacterDetail({ character }: CharacterDetailProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<any[]>([])
  
  const avatarSrc = character.avatar_url || '/placeholder-avatar.png'

  // Function to get session ID and messages from child CharacterChat component
  const handleCharacterChatMount = (childSessionId: string, childMessages: any[]) => {
    setSessionId(childSessionId)
    setMessages(childMessages)
  }

  // Update messages when they change in the CharacterChat component
  const handleMessagesUpdate = (updatedMessages: any[]) => {
    setMessages(updatedMessages)
  }

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-[#0e1016] border-b border-[#292d3e] py-3 px-4 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 shadow">
              {imageError ? (
                <div className="w-full h-full bg-[#301e63] flex items-center justify-center text-white font-medium">
                  {character.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img 
                  src={avatarSrc} 
                  alt={character.name} 
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{character.name}</h1>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a1c25] transition-colors"
              aria-label={showInfo ? "Hide character info" : "Show character info"}
            >
              <FaInfoCircle className="h-5 w-5" />
            </button>
            <button
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-[#1a1c25] transition-colors"
            >
              <FaEllipsisV className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Character Info Banner - Collapsible */}
        <AnimatePresence>
          {showInfo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 bg-[#151722] border-b border-[#292d3e] z-20 overflow-hidden shadow-lg"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-white">About {character.name}</h2>
                  <button 
                    onClick={() => setShowInfo(false)}
                    className="p-2 rounded-full hover:bg-[#222532] text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Description Section */}
                  <div className="bg-[#1e2133]/70 p-3 rounded-lg border border-[#343a4f]">
                    <button 
                      onClick={() => toggleSection('description')} 
                      className="w-full flex justify-between items-center text-left"
                    >
                      <h3 className="text-base font-semibold text-white flex items-center">
                        <span className="text-indigo-400 mr-2">
                          <FaInfoCircle className="w-4 h-4" />
                        </span>
                        Description
                      </h3>
                      {expandedSection === 'description' ? 
                        <FaCaretUp className="text-gray-400" /> : 
                        <FaCaretDown className="text-gray-400" />
                      }
                    </button>
                    
                    <AnimatePresence>
                      {expandedSection === 'description' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 text-gray-300 text-sm">{character.description || "No description available."}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Personality Section */}
                  <div className="bg-[#1e2133]/70 p-3 rounded-lg border border-[#343a4f]">
                    <button 
                      onClick={() => toggleSection('personality')} 
                      className="w-full flex justify-between items-center text-left"
                    >
                      <h3 className="text-base font-semibold text-white flex items-center">
                        <span className="text-indigo-400 mr-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </span>
                        Personality
                      </h3>
                      {expandedSection === 'personality' ? 
                        <FaCaretUp className="text-gray-400" /> : 
                        <FaCaretDown className="text-gray-400" />
                      }
                    </button>
                    
                    <AnimatePresence>
                      {expandedSection === 'personality' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 flex flex-wrap gap-2">
                            {character.personality.split(',').map((trait, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-800"
                              >
                                {trait.trim()}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Voice Type Section */}
                  <div className="bg-[#1e2133]/70 p-3 rounded-lg border border-[#343a4f]">
                    <button 
                      onClick={() => toggleSection('voice')} 
                      className="w-full flex justify-between items-center text-left"
                    >
                      <h3 className="text-base font-semibold text-white flex items-center">
                        <span className="text-indigo-400 mr-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </span>
                        Voice Type
                      </h3>
                      {expandedSection === 'voice' ? 
                        <FaCaretUp className="text-gray-400" /> : 
                        <FaCaretDown className="text-gray-400" />
                      }
                    </button>
                    
                    <AnimatePresence>
                      {expandedSection === 'voice' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 text-gray-300 capitalize flex items-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-800">
                              {character.voice_type || "natural"}
                            </span>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 h-full">
          <CharacterChat 
            character={character}
            onSessionIdChange={handleCharacterChatMount}
            onMessagesChange={handleMessagesUpdate}
          />
        </div>
      </div>
    </div>
  )
} 