'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { FaSearch } from 'react-icons/fa'
import { characterApi, Character } from '@/lib/api'
import { useRouter } from 'next/navigation'

// Define preset situational chats
const situationalChats = [
  {
    id: 'astronaut-chat',
    title: 'Astronaut Sara',
    description: 'Intruder on board defensive protocol activated prepare for elimination "guns deployed."',
    image: '/images/astronaut.webp',
    color: 'from-purple-600 to-pink-600',
    defaultImage: '👩‍🚀'
  },
  {
    id: 'liberty-chat',
    title: 'Lady Liberty',
    description: 'You see a flame faintly glowing in an alleyway. You investigate and you see what looks like a...',
    image: '/images/liberty.png',
    color: 'from-cyan-500 to-blue-500',
    defaultImage: '🗽'
  },
  {
    id: 'venture-chat',
    title: 'Venture Beyond',
    description: 'Forge your path. Rule with power. Scheme with style.',
    image: '/images/venture.png',
    color: 'from-amber-500 to-orange-600',
    defaultImage: '🗻'
  }
]

// Featured characters categories
const featuredCategories = [
  {
    title: 'Gigachad',
    description: 'I\'m the Gigachad and I\'m here to help fellow kings',
    image: '/images/gigachad.jpeg',
    color: 'from-gray-700 to-gray-900',
    defaultImage: '💪'
  },
  {
    title: 'The Adonis',
    description: 'I am Adonis and I aim to help young men improve',
    image: '/images/adonis.png',
    color: 'from-yellow-600 to-red-600',
    defaultImage: '👑'
  },
  {
    title: 'Mark',
    description: 'did you just break my thing ***again***?',
    image: '/images/mark.webp',
    color: 'from-gray-800 to-gray-950',
    defaultImage: '👨'
  },
  {
    title: 'Roblox Kid',
    description: 'I am a kid who loves Roblox!',
    image: '/images/roblox-kid.jpg',
    color: 'from-red-500 to-red-700',
    defaultImage: '🎮'
  }
]

// What can be done section data
const whatCanBeDone = [
  {
    title: "Venture beyond. Forge your path.",
    description: "Create unique personalities and explore endless possibilities with AI companions.",
    video: "/videos/istockphoto-699620004-640_adpp_is.mp4",
    color: "from-indigo-600 to-purple-600"
  },
  {
    title: "Rule with power. Scheme with style.",
    description: "Lead conversations that challenge your strategic thinking and creativity.",
    video: "/videos/istockphoto-1550973385-640_adpp_is.mp4",
    color: "from-blue-600 to-indigo-600"
  }
]

// Additional situational chats
const additionalChats = [
  {
    id: 'plastic-chat',
    title: 'Plastic Bag',
    description: 'Barely holding it together, always full of baggage',
    image: '/images/plastic-bag.jpg',
    color: 'from-gray-500 to-gray-700',
    defaultImage: '🛍️'
  },
  {
    id: 'qs10-chat',
    title: 'Can I ask you a QS10',
    description: 'It\'s giving... nothing',
    image: '/images/qs10.png',
    color: 'from-yellow-400 to-yellow-600',
    defaultImage: '❓'
  },
  {
    id: 'name-generator',
    title: 'Name Generator',
    description: 'For OCs, fictional places, cities, taverns, etc.',
    image: '/images/name-generator.png',
    color: 'from-green-500 to-emerald-700',
    defaultImage: '📝'
  },
  {
    id: 'ai-art',
    title: 'AI Art Prompt Maker',
    description: 'Writes narrative prompts for you 🎨',
    image: '/images/ai-art.png',
    color: 'from-blue-600 to-purple-800',
    defaultImage: '🎨'
  }
]

// Define types for component props
interface CardProps {
  title: string;
  description: string;
  image?: string;
  color: string;
  defaultImage?: string;
  video?: string;
}

// Character card component
function CharacterCard({ title, description, image, color, defaultImage }: CardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <motion.div
      className="bg-[#151722] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-[#292d3e] hover:border-indigo-500/50"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Character Image/Avatar */}
      <div className="w-full aspect-[3/2] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-transparent to-transparent z-10"></div>
        {!imageError ? (
          <div className="w-full h-full relative">
            <img 
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-800/30 to-purple-800/30">
            <span className="text-6xl font-bold text-white/30">{defaultImage || title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">{title}</h3>
        <p className="text-gray-400 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">{description}</p>
        
        {/* Tags or metadata */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-500">
            Featured
          </div>
          
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/30">
              Character
            </span>
          </div>
        </div>
      </div>
      
      {/* Interactive indicator */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </motion.div>
  )
}

// Situational chat card component
function SituationalChatCard({ title, description, image, color, defaultImage }: CardProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <motion.div
      className="bg-[#151722] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-[#292d3e] hover:border-indigo-500/50 relative"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Coming Soon Banner */}
      <div className="absolute top-0 right-0 w-full z-20 overflow-hidden">
        <div className="absolute transform rotate-45 bg-indigo-600 text-white font-bold py-1 right-[-35px] top-[20px] w-[170px] text-center shadow-lg z-30">
          COMING SOON
        </div>
      </div>
      
      {/* Character Image/Avatar */}
      <div className="w-full aspect-[3/2] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-transparent to-transparent z-10"></div>
        {!imageError ? (
          <div className="w-full h-full relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-80`}></div>
            <img 
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-75"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color}`}>
            <span className="text-6xl font-bold text-white/30">{defaultImage || title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        
        {/* Title overlay on image */}
        <div className="absolute bottom-0 w-full p-4 z-10 text-center">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-100 transition-colors drop-shadow-md">{title}</h3>
        </div>
      </div>

      {/* Character Info */}
      <div className="p-4">
        <p className="text-gray-400 text-sm line-clamp-2 min-h-[2.5rem]">{description}</p>
        
        <div className="mt-4">
          <button disabled className="w-full py-2 bg-gray-600 text-white rounded-md transition-colors cursor-not-allowed opacity-80">
            Start Chat
          </button>
        </div>
      </div>
      
      {/* Interactive indicator */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </motion.div>
  )
}

// Featured image/video card component
function FeaturedImageCard({ title, description, image, video, color }: CardProps) {
  const hasVideo = !!video;

  return (
    <motion.div
      className="bg-[#151722] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-[#292d3e] hover:border-indigo-500/50 relative"
      whileHover={{ y: -5, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Media Background */}
      <div className="w-full aspect-[16/9] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-black/30 to-transparent z-10"></div>
        
        {hasVideo ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
            <source src={video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : image ? (
          <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
        )}
        
        {/* Title overlay on image */}
        <div className="absolute bottom-0 w-full p-5 z-10">
          <h3 className="text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors drop-shadow-md">{title}</h3>
        </div>
      </div>
      
      {/* Description and Button */}
      <div className="p-4">
        <p className="text-gray-400 text-sm line-clamp-2 min-h-[2.5rem] mb-4">{description}</p>
        
        <button className={`py-2 px-4 w-full bg-gradient-to-r ${color} text-white rounded-md hover:brightness-110 transition-all`}>
          Explore More
        </button>
      </div>
      
      {/* Interactive indicator */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </motion.div>
  )
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
      return
    }
    
    // Fetch the characters
    const fetchCharacters = async () => {
      try {
        const data = await characterApi.list()
        setCharacters(data)
      } catch (error) {
        console.error('Error fetching characters:', error)
      }
    }
    
    fetchCharacters()
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [router])
  
  // Filter characters based on search query
  const filteredCharacters = searchQuery 
    ? characters.filter(char => 
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (char.description && char.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070809] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#070809] text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Search bar */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 pl-12 pr-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 transition-all text-lg"
              />
            </div>
          </div>
          
          {/* Search Results */}
          {searchQuery && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-6">Search Results</h2>
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredCharacters.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredCharacters.map((character) => (
                    <Link key={character.id} href={`/characters/${character.id}`}>
                      <motion.div
                        className="bg-[#151722] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all group border border-[#292d3e] hover:border-indigo-500/50"
                        whileHover={{ y: -5 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Character Image/Avatar */}
                        <div className="w-full aspect-[3/2] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-transparent to-transparent z-10"></div>
                          <div className="w-full h-full relative">
                            <img 
                              src={character.avatar_url || "/placeholder-avatar.png"} 
                              alt={character.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                // When image fails to load, show the fallback div with first letter
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('fallback-active');
                              }}
                            />
                            <div className="hidden fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-800/30 to-purple-800/30">
                              <span className="text-6xl font-bold text-white/30">{character.name.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Character Info */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">{character.name}</h3>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">{character.description || "No description available"}</p>
                          
                          {/* Personality tags */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-gray-500">
                              AI Character
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {character.personality && character.personality.split(',').slice(0, 1).map((trait, index) => (
                                <span 
                                  key={index} 
                                  className="px-2 py-0.5 text-xs rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/30"
                                >
                                  {trait.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Interactive indicator */}
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-12">No characters found matching "{searchQuery}"</p>
              )}
            </section>
          )}
          
          {/* Only show other sections if not searching */}
          {!searchQuery && (
            <>
              {/* Featured situational chats */}
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6">Featured Situations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {situationalChats.map((chat, index) => (
                    <SituationalChatCard
                      key={chat.id}
                      title={chat.title}
                      description={chat.description}
                      image={chat.image}
                      color={chat.color}
                      defaultImage={chat.defaultImage}
                    />
                  ))}
                </div>
              </section>
              
              {/* What can be done section */}
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6">What Can Be Done</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {whatCanBeDone.map((item, index) => (
                    <FeaturedImageCard
                      key={index}
                      title={item.title}
                      description={item.description}
                      video={item.video}
                      color={item.color}
                    />
                  ))}
                </div>
              </section>
              
              {/* For you section */}
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6">For You</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {featuredCategories.map((character, index) => (
                    <CharacterCard
                      key={index}
                      title={character.title}
                      description={character.description}
                      image={character.image}
                      color={character.color}
                      defaultImage={character.defaultImage}
                    />
                  ))}
                </div>
              </section>
              
              {/* Recommended situations */}
              <section>
                <h2 className="text-2xl font-bold mb-6">Featured</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {additionalChats.map((chat, index) => (
                    <CharacterCard
                      key={chat.id}
                      title={chat.title}
                      description={chat.description}
                      image={chat.image}
                      color={chat.color}
                      defaultImage={chat.defaultImage}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
} 