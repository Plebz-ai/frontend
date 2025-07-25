'use client'

import React, { useState, useEffect } from 'react'
import { Character } from '../../lib/api'
import CharacterChat from './CharacterChat'
import VideoCall from '../video-call/VideoCall'
import VoiceCall from '../video-call/VoiceCall'
import { motion, AnimatePresence } from 'motion/react'
import { FaPhone, FaInfoCircle, FaTimes, FaCaretDown, FaCaretUp, FaVideo, FaEllipsisV, FaClock, FaHeart, FaBook, FaMicrophone } from 'react-icons/fa'
import Image from 'next/image'

interface CharacterDetailProps {
  character: Character
}

// Helper function to get journey type icon and color
const getJourneyTypeInfo = (journeyType?: string) => {
  switch (journeyType) {
    case 'future-self':
      return { icon: FaClock, color: 'from-blue-500 to-cyan-500', label: 'Future Self' }
    case 'loved-one':
      return { icon: FaHeart, color: 'from-pink-500 to-rose-500', label: 'Lost Loved One' }
    case 'historical':
      return { icon: FaBook, color: 'from-amber-500 to-orange-500', label: 'Historical Figure' }
    default:
      return { icon: FaInfoCircle, color: 'from-purple-500 to-indigo-500', label: 'Custom Character' }
  }
}

export default function CharacterDetail({ character }: CharacterDetailProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<any[]>([])
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  
  const avatarSrc = character.avatar_url || '/placeholder-avatar.png'
  const journeyInfo = getJourneyTypeInfo(character.journey_type)

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

  const handleVoiceCallClick = () => {
    setShowVoiceCall(true);
  };

  const handleCloseVoiceCall = () => {
    setShowVoiceCall(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 py-4 px-6 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border-2 border-gray-600/50">
                {imageError ? (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
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
              {/* Journey type indicator */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${journeyInfo.color} rounded-full flex items-center justify-center border-2 border-gray-800`}>
                <journeyInfo.icon className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">{character.name}</h1>
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${journeyInfo.color} text-white`}>
                  {journeyInfo.label}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Time Bridge Active</span>
              </div>
              {character.tagline && (
                <p className="text-sm text-gray-500 mt-1">{character.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleVoiceCallClick}
              className="p-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all duration-200 shadow-lg hover:shadow-green-500/30"
              aria-label="Start voice call"
            >
              <FaMicrophone className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowVideoCall(true)}
              className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-200 shadow-lg hover:shadow-indigo-500/30"
              aria-label="Start video call"
            >
              <FaVideo className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
              aria-label={showInfo ? "Hide character info" : "Show character info"}
            >
              <FaInfoCircle className="h-5 w-5" />
            </button>
            <button
              className="p-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
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
              className="absolute top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 z-20 overflow-hidden shadow-xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${journeyInfo.color} rounded-lg flex items-center justify-center`}>
                      <journeyInfo.icon className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">About {character.name}</h2>
                  </div>
                  <button 
                    onClick={() => setShowInfo(false)}
                    className="p-2 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Description Section */}
                  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
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
                          <p className="mt-3 text-gray-300 text-sm leading-relaxed">{character.description || "No description available."}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Personality Section */}
                  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
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
                          <div className="mt-3 flex flex-wrap gap-2">
                            {character.personality.split(',').map((trait, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-800/50"
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
                  <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
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
                          <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-800/50">
                              {character.voice_type || 'Auto-selected'}
                            </span>
                          </div>
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
        <div className="flex-1 flex flex-col">
          <CharacterChat 
            characterId={character.id} 
            character={character}
            onMount={handleCharacterChatMount}
            onMessagesUpdate={handleMessagesUpdate}
          />
        </div>
      </div>

      {/* Video Call Modal */}
      <AnimatePresence>
        {showVideoCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <VideoCall
              character={character}
              onClose={() => setShowVideoCall(false)}
              sessionId={sessionId}
              initialMessages={messages}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Call Modal */}
      <AnimatePresence>
        {showVoiceCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <VoiceCall 
              character={character} 
              onClose={handleCloseVoiceCall}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 