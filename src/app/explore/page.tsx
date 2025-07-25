'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Search, Plus, Sparkles, Star, Clock, Filter, User, Grid, Menu, X, ChevronRight, ChevronDown, Heart, BookOpen, Zap, MessageCircle, Video, Mic, ArrowRight, Crown, TrendingUp, Bot, Globe, Shield, Infinity } from 'lucide-react'
import { characterApi, Character } from '@/lib/api'
import { useRouter } from 'next/navigation'

// Aletheia Journey Types with enhanced commercial design
const journeyTypes = [
  {
    id: 'future-self',
    title: 'Your Future Self',
    subtitle: 'Break into the future',
    description: 'Create an AI version of your future self - wiser, more experienced, and ready to guide you through life\'s challenges.',
    icon: Zap,
    color: 'from-emerald-500 to-teal-500',
    gradient: 'from-emerald-600/20 to-teal-600/20',
    examples: ['Future You (2030)', 'Future You (2050)', 'Wiser Self'],
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    features: ['Advanced personality modeling', 'Future insights', 'Personal growth tracking']
  },
  {
    id: 'loved-one',
    title: 'Lost Loved Ones',
    subtitle: 'Reconnect with the past',
    description: 'Honor and reconnect with family members who have passed. Share memories, seek advice, and keep their spirit alive.',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    gradient: 'from-pink-600/20 to-rose-600/20',
    examples: ['Grandma Sarah', 'Dad\'s Wisdom', 'Mom\'s Love'],
    bgGradient: 'from-pink-500/10 to-rose-500/10',
    features: ['Memory preservation', 'Emotional connection', 'Family wisdom']
  },
  {
    id: 'historical',
    title: 'Historical Figures',
    subtitle: 'Learn from legends',
    description: 'Converse with history\'s greatest minds - Einstein, Marie Curie, Shakespeare, and more.',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    gradient: 'from-amber-600/20 to-orange-600/20',
    examples: ['Albert Einstein', 'Marie Curie', 'William Shakespeare'],
    bgGradient: 'from-amber-500/10 to-orange-500/10',
    features: ['Historical accuracy', 'Educational insights', 'Timeless wisdom']
  },
  {
    id: 'mentor',
    title: 'AI Mentors',
    subtitle: 'Expert guidance',
    description: 'Connect with AI mentors specialized in various fields - business, creativity, health, and personal development.',
    icon: Crown,
    color: 'from-purple-500 to-indigo-500',
    gradient: 'from-purple-600/20 to-indigo-600/20',
    examples: ['Business Coach', 'Creative Director', 'Life Coach'],
    bgGradient: 'from-purple-500/10 to-indigo-500/10',
    features: ['Expert knowledge', 'Personalized guidance', 'Skill development']
  }
]

const featuredCharacters = [
  {
    id: 1,
    name: 'Future You (2030)',
    description: 'Your wiser, more experienced future self',
    avatar: '/placeholder-avatar.png',
    category: 'future-self',
    rating: 4.9,
    conversations: 1247,
    tags: ['Personal Growth', 'Future Planning', 'Wisdom']
  },
  {
    id: 2,
    name: 'Albert Einstein',
    description: 'Theoretical physicist and Nobel laureate',
    avatar: '/placeholder-avatar.png',
    category: 'historical',
    rating: 4.8,
    conversations: 2156,
    tags: ['Science', 'Physics', 'Philosophy']
  },
  {
    id: 3,
    name: 'Creative Director',
    description: 'Expert in design, art, and creative thinking',
    avatar: '/placeholder-avatar.png',
    category: 'mentor',
    rating: 4.7,
    conversations: 892,
    tags: ['Creativity', 'Design', 'Innovation']
  },
  {
    id: 4,
    name: 'Grandma Sarah',
    description: 'Warm, loving grandmother with life wisdom',
    avatar: '/placeholder-avatar.png',
    category: 'loved-one',
    rating: 4.9,
    conversations: 1567,
    tags: ['Family', 'Love', 'Wisdom']
  }
]

// Categories for filter
const categories = [
  { id: 'all', name: 'All Journeys' },
  { id: 'future-self', name: 'Future Self' },
  { id: 'loved-one', name: 'Lost Loved Ones' },
  { id: 'historical', name: 'Historical Figures' },
  { id: 'mentor', name: 'AI Mentors' },
]

// Define types for component props
interface CardProps {
  title: string;
  description: string;
  image?: string;
  color: string;
  defaultImage?: string;
  video?: string;
  featured?: boolean;
  onClick?: () => void;
  features?: string[];
}

interface JourneyTypeCardProps {
  journey: typeof journeyTypes[0];
  onClick: () => void;
}

// Enhanced animated background component
const AnimatedBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-gray-900/40 to-black/80"></div>
    <motion.div 
      className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-teal-600/20 blur-3xl"
      animate={{ 
        x: [0, 20, 0],
        y: [0, -20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ 
        duration: 15,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    />
    <motion.div 
      className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl"
      animate={{ 
        x: [0, -10, 0],
        y: [0, 30, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{ 
        duration: 18,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    />
  </div>
)

// Modern loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#070809] flex items-center justify-center">
    <div className="relative w-20 h-20">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-teal-200/20 rounded-full opacity-30 animate-ping"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-teal-600 border-l-teal-600 border-b-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Sparkles className="w-6 h-6 text-teal-400" />
      </div>
    </div>
  </div>
)

// Enhanced journey type card component
function JourneyTypeCard({ journey, onClick }: JourneyTypeCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const IconComponent = journey.icon

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl card-modern hover:scale-105 transition-all duration-500 cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${journey.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10 p-6">
        <div className="flex items-start space-x-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${journey.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-teal-400 mb-2 tracking-wider uppercase">{journey.subtitle}</p>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gradient transition-all duration-300">{journey.title}</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">{journey.description}</p>
            <div className="flex flex-wrap gap-2">
              {journey.examples.map((example, index) => (
                <span key={index} className="px-3 py-1 bg-white/5 text-gray-300 text-sm rounded-full border border-white/10">
                  {example}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center text-teal-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
          Explore this journey
          <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced character card component
function CharacterCard({ title, description, image, color, defaultImage, featured = false, onClick, features }: CardProps) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl card-modern hover:scale-105 transition-all duration-500 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative z-10 p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-lg`}>
            {defaultImage}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-colors">{title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
        
        {features && (
          <div className="flex flex-wrap gap-2 mb-4">
            {features.map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
                {feature}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-teal-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
            Start conversation
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
          {featured && (
            <div className="flex items-center text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-xs ml-1">Featured</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function ExplorePage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        const data = await characterApi.list()
        setCharacters(data)
      } catch (error) {
        console.error('Error fetching characters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCharacters()
  }, [])

  const handleJourneyClick = (journeyId: string) => {
    if (journeyId === 'custom') {
      router.push('/create')
    } else {
      setSelectedCategory(journeyId)
    }
  }

  const handleCharacterClick = (characterId: string | number) => {
    router.push(`/characters/${characterId}`)
  }

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         character.personality?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || character.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return (b.conversation_count || 0) - (a.conversation_count || 0)
    }
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
                <span className="text-sm font-medium text-emerald-400">Explore AI Characters</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                Discover <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Amazing</span> AI Characters
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Connect with AI personalities that inspire, guide, and entertain. From historical figures to future mentors, find your perfect AI companion.
              </p>
            </motion.div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search characters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300"
                  >
                    <option value="">All Categories</option>
                    <option value="future-self">Future Self</option>
                    <option value="loved-one">Loved Ones</option>
                    <option value="historical">Historical Figures</option>
                    <option value="mentor">AI Mentors</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-300"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="recent">Recently Added</option>
                    <option value="rating">Highest Rated</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        viewMode === 'grid' 
                          ? 'bg-emerald-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        viewMode === 'list' 
                          ? 'bg-emerald-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Types */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Choose Your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Journey</span>
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Four unique paths to explore the future of AI interaction
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {journeyTypes.map((journey, index) => (
                <motion.div
                  key={journey.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${journey.bgGradient} border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:scale-105`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${journey.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                        <journey.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                        {journey.title}
                      </h3>
                      
                      <p className="text-sm text-emerald-400 mb-3 font-medium">
                        {journey.subtitle}
                      </p>
                      
                      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                        {journey.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        {journey.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {journey.examples.length} examples
                        </span>
                        <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Featured Characters */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Characters</span>
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Most popular and highly-rated AI characters loved by our community
              </p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {featuredCharacters.map((character, index) => (
                  <motion.div
                    key={character.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-500 group-hover:scale-105">
                      <div className="relative">
                        <img
                          src={character.avatar}
                          alt={character.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-white font-medium">{character.rating}</span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                          {character.name}
                        </h3>
                        
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                          {character.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {character.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <div className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              <span>{character.conversations}</span>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                            Start Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Create Your Own <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">AI Character</span>?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Design and customize your perfect AI companion with our advanced character creation tools
              </p>
              <Link href="/create">
                <button className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105">
                  <span className="relative z-10 flex items-center">
                    Create Character
                    <Plus className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 