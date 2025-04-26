'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Search, Plus, Sparkles, Star, Clock, Filter, User, Grid, Menu, X, ChevronRight, ChevronDown } from 'lucide-react'
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

// Categories for filter
const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'popular', name: 'Popular' },
  { id: 'recommended', name: 'Recommended' },
  { id: 'recent', name: 'Recent' },
  { id: 'favorites', name: 'Favorites' },
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
}

// Animated blur background component
const AnimatedBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-gray-900/40 to-black/80"></div>
    <motion.div 
      className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"
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
      className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl"
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

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#070809] flex items-center justify-center">
    <div className="relative w-20 h-20">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200/20 rounded-full opacity-30 animate-ping"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-600 border-l-indigo-600 border-b-purple-600 border-r-purple-600 rounded-full animate-spin"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Sparkles className="w-6 h-6 text-indigo-400" />
      </div>
    </div>
  </div>
)

// Character card component with glass morphism and enhanced animations
function CharacterCard({ title, description, image, color, defaultImage, featured = false, onClick }: CardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`group relative flex flex-col rounded-2xl overflow-hidden backdrop-blur-sm ${
        featured 
          ? 'ring-2 ring-indigo-500 bg-black/40' 
          : 'ring-1 ring-white/10 bg-black/30'
      } shadow-lg hover:shadow-xl transition-all duration-500`}
      whileHover={{ y: -5, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      {featured && (
        <div className="absolute top-3 right-3 z-20">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
          >
            <Star className="w-4 h-4" />
          </motion.div>
        </div>
      )}
      
      {/* Character Image/Avatar with parallax effect */}
      <div className="w-full aspect-[3/2] relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"
          style={{ 
            opacity: isHovered ? 0.8 : 0.6,
            background: isHovered ? 
              'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1))' : 
              'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2) 70%, rgba(0,0,0,0))'
          }}
        />
        
        {!imageError ? (
          <motion.div 
            className="w-full h-full relative"
            style={{ 
              scale: isHovered ? 1.1 : 1,
              transition: 'scale 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)'
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-30 mix-blend-overlay`}></div>
            <img 
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </motion.div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color}`}>
            <span className="text-6xl font-bold text-white/30">{defaultImage || title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        
        {/* Animated overlay on hover */}
        <motion.div 
          className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-end p-4 z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 mr-3 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-indigo-300">AI Character</p>
              <motion.button 
                className="text-white text-sm flex items-center"
                whileHover={{ x: 5 }}
              >
                <span>View details</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Character Info */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{title}</h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{description}</p>
        </div>
        
        {/* Tags or metadata */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/30">
              Character
            </span>
          </div>
          
          <motion.div 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-indigo-600/20 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4 text-indigo-300" />
          </motion.div>
        </div>
      </div>
      
      {/* Interactive glow indicator */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      
      {/* Corner glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-indigo-600/10 group-hover:bg-indigo-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </motion.div>
  )
}

// Situational chat card component
function SituationalChatCard({ title, description, image, color, defaultImage }: CardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      className="group relative flex flex-col rounded-2xl overflow-hidden backdrop-blur-sm bg-black/30 ring-1 ring-white/10 shadow-lg hover:shadow-xl hover:ring-indigo-500/50 transition-all duration-500"
      whileHover={{ y: -5, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Coming Soon Badge */}
      <div className="absolute top-0 right-0 w-full z-20">
        <motion.div 
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="absolute transform rotate-45 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-1 right-[-35px] top-[20px] w-[170px] text-center shadow-lg z-30"
        >
          COMING SOON
        </motion.div>
      </div>
      
      {/* Character Image/Avatar with parallax effect */}
      <div className="w-full aspect-[3/2] relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"
          style={{ 
            opacity: isHovered ? 0.8 : 0.6,
            background: isHovered ? 
              'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1))' : 
              'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2) 70%, rgba(0,0,0,0))'
          }}
        />
        
        {!imageError ? (
          <motion.div 
            className="w-full h-full relative"
            style={{ 
              scale: isHovered ? 1.1 : 1,
              transition: 'scale 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)'
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-80`}></div>
            <img 
              src={image}
              alt={title}
              className="w-full h-full object-cover opacity-75"
              onError={() => setImageError(true)}
            />
          </motion.div>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color}`}>
            <span className="text-6xl font-bold text-white/30">{defaultImage || title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        
        {/* Title overlay on image */}
        <div className="absolute bottom-0 w-full p-4 z-10">
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-100 transition-colors drop-shadow-md">{title}</h3>
        </div>
      </div>

      {/* Character Info */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{description}</p>
        
        <button disabled className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm">
          <span className="relative flex items-center justify-center">
            <span className="mr-2">Start Chat</span>
            <span className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
              <ChevronRight className="w-4 h-4" />
            </span>
          </span>
          </button>
      </div>
      
      {/* Interactive glow indicator */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </motion.div>
  )
}

// Featured image/video card component
function FeaturedImageCard({ title, description, image, video, color }: CardProps) {
  const hasVideo = !!video;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="group relative flex flex-col rounded-2xl overflow-hidden backdrop-blur-sm bg-black/30 ring-1 ring-white/10 shadow-lg hover:shadow-xl hover:ring-indigo-500/30 transition-all duration-500"
      whileHover={{ y: -7, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Media Background */}
      <div className="w-full aspect-[16/9] relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"
          animate={{ 
            background: isHovered ? 
              'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.1))' : 
              'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1))'
          }}
          transition={{ duration: 0.3 }}
        />
        
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
        <div className="absolute bottom-0 w-full p-6 z-10">
          <div className="flex items-center mb-2">
            <motion.div 
              className="w-8 h-8 rounded-full bg-indigo-600/80 flex items-center justify-center mr-3"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Featured</span>
          </div>
          <h3 className="text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors drop-shadow-md max-w-[80%]">{title}</h3>
        </div>
      </div>
      
      {/* Description and Button */}
      <div className="p-6">
        <p className="text-gray-400 text-sm line-clamp-2 min-h-[2.5rem] mb-5">{description}</p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-2.5 bg-gradient-to-r ${color} text-white rounded-xl shadow-md hover:shadow-indigo-500/20 transition-all duration-300`}
        >
          <span className="relative flex items-center justify-center">
            <span>Explore More</span>
            <motion.span 
              className="absolute right-4"
              animate={{ x: isHovered ? 5 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.span>
          </span>
        </motion.button>
      </div>
      
      {/* Corner glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-indigo-600/10 group-hover:bg-indigo-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </motion.div>
  )
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()
  const headerRef = useRef<HTMLDivElement>(null)
  
  // Scroll animations
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1])
  const headerBackgroundColor = useTransform(scrollY, [0, 100], ['rgba(7, 8, 9, 0)', 'rgba(7, 8, 9, 0.8)'])
  const headerBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)'])
  const headerBorder = useTransform(scrollY, [0, 100], ['1px solid rgba(255, 255, 255, 0)', '1px solid rgba(255, 255, 255, 0.05)'])
  
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
        setSearchLoading(true)
        const data = await characterApi.list()
        setCharacters(data)
        setSearchLoading(false)
      } catch (error) {
        console.error('Error fetching characters:', error)
        setSearchLoading(false)
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
    return <LoadingSpinner />
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#070809] text-white overflow-x-hidden">
        <AnimatedBackground />
        
        {/* Floating Header with blur effect on scroll */}
        <motion.div 
          ref={headerRef}
          className="sticky top-0 z-50"
          style={{ 
            backgroundColor: headerBackgroundColor,
            backdropFilter: headerBlur,
            borderBottom: headerBorder,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors lg:hidden"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="relative flex-1 max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 text-gray-200 pl-12 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder-gray-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <Menu className="w-4 h-4" />
              </button>
              
              <div className="h-6 w-px bg-white/10 mx-1"></div>
              
              <Link href="/pricing" className="hidden md:flex items-center text-sm mr-2 text-white/80 hover:text-white transition-colors">
                Pricing
              </Link>
              
              <Link href="/create" className="hidden sm:flex">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full px-4 py-2 shadow-md hover:shadow-indigo-500/30 transition-shadow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Create Character</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
        
        <div className="flex relative z-10">
          {/* Sidebar Navigation */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-black/80 backdrop-blur-xl shadow-lg border-r border-white/5 overflow-y-auto"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Explore</h2>
                    <button 
                      onClick={() => setMenuOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                </div>
                  
                  <nav className="space-y-1">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(category.id)
                          setMenuOpen(false)
                        }}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                          activeCategory === category.id 
                            ? 'bg-indigo-600/20 text-indigo-300' 
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {category.id === 'all' && <Menu className="w-4 h-4 mr-3" />}
                        {category.id === 'popular' && <Star className="w-4 h-4 mr-3" />}
                        {category.id === 'recommended' && <Sparkles className="w-4 h-4 mr-3" />}
                        {category.id === 'recent' && <Clock className="w-4 h-4 mr-3" />}
                        {category.id === 'favorites' && <Star className="w-4 h-4 mr-3" />}
                        {category.name}
                      </button>
                    ))}
                  </nav>
                  
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Characters</h3>
                    <div className="space-y-1">
                      {featuredCategories.slice(0, 3).map((category, idx) => (
                        <div key={idx} className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gray-800 mr-3 flex-shrink-0 overflow-hidden">
                            {category.image ? (
                              <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-900/30">
                                <span>{category.defaultImage}</span>
                            </div>
                            )}
                          </div>
                          <span className="truncate">{category.title}</span>
                        </div>
                      ))}
                    </div>
                            </div>
                            
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Pages</h3>
                    <div className="space-y-1">
                      <Link href="/pricing" className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mr-3 flex-shrink-0 flex items-center justify-center text-white">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>Pricing Plans</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-56 fixed inset-y-0 pt-20 pl-6 pr-3 overflow-y-auto">
            <nav className="space-y-1 mb-8">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/20' 
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {category.id === 'all' && <Menu className="w-4 h-4 mr-3" />}
                  {category.id === 'popular' && <Star className="w-4 h-4 mr-3" />}
                  {category.id === 'recommended' && <Sparkles className="w-4 h-4 mr-3" />}
                  {category.id === 'recent' && <Clock className="w-4 h-4 mr-3" />}
                  {category.id === 'favorites' && <Star className="w-4 h-4 mr-3" />}
                  {category.name}
                </button>
              ))}
            </nav>
            
            <div className="pt-6 border-t border-white/5">
              <h3 className="text-sm font-medium text-gray-400 mb-3 px-3">Recent Characters</h3>
              <div className="space-y-1">
                {featuredCategories.slice(0, 3).map((category, idx) => (
                  <div key={idx} className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-800 mr-3 flex-shrink-0 overflow-hidden">
                      {category.image ? (
                        <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-900/30">
                          <span>{category.defaultImage}</span>
                        </div>
                      )}
                    </div>
                    <span className="truncate">{category.title}</span>
                  </div>
                              ))}
                            </div>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <h3 className="text-sm font-medium text-gray-400 mb-3 px-3">Pages</h3>
              <div className="space-y-1">
                <Link href="/pricing" className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mr-3 flex-shrink-0 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>Pricing Plans</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <main className="flex-1 pt-8 pb-20 lg:pl-56">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Search Results */}
              {searchQuery && (
                <section className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Search Results</h2>
                    <div className="text-sm text-gray-400">
                      Found {filteredCharacters.length} result{filteredCharacters.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                  {searchLoading ? (
                    <div className="flex justify-center py-16">
                      <div className="relative w-12 h-12">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200/10 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-l-indigo-600 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  ) : filteredCharacters.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredCharacters.map((character) => (
                        <Link key={character.id} href={`/characters/${character.id}`}>
                          <CharacterCard
                            title={character.name}
                            description={character.description || "No description available"}
                            image={character.avatar_url || "/placeholder-avatar.png"}
                            color="from-indigo-800/30 to-purple-800/30"
                            defaultImage={character.name.charAt(0).toUpperCase()}
                          />
                    </Link>
                  ))}
                </div>
              ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                    >
                      <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-300 mb-2">No characters found</p>
                      <p className="text-gray-400">No characters matching "{searchQuery}"</p>
                    </motion.div>
              )}
            </section>
          )}
          
          {/* Only show other sections if not searching */}
          {!searchQuery && (
            <>
                  {/* Top Banner: Featured Characters */}
              <section className="mb-16">
                    <div className="mb-10 flex items-center space-x-3">
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg"
                      >
                        <Sparkles className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold">Premium Scenarios</h2>
                        <p className="text-gray-400">Specially crafted situations and characters</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          >
                            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </motion.div>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Discover Possibilities</h2>
                          <p className="text-gray-400">What you can achieve with our platform</p>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden md:flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        <span>View all features</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </motion.button>
                    </div>
                    
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
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 ring-1 ring-white/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">For You</h2>
                          <p className="text-gray-400">Characters recommended based on your preferences</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center space-x-2">
                        <button className="px-3 py-1.5 text-sm rounded-lg bg-black/20 text-gray-300 hover:bg-black/30 transition-colors border border-white/5">
                          Popular
                        </button>
                        <button className="px-3 py-1.5 text-sm rounded-lg bg-black/20 text-gray-300 hover:bg-black/30 transition-colors border border-white/5">
                          New
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-black/20 text-gray-300 hover:bg-black/30 transition-colors flex items-center justify-center border border-white/5">
                          <Filter className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredCategories.map((character, index) => (
                    <CharacterCard
                      key={index}
                      title={character.title}
                      description={character.description}
                      image={character.image}
                      color={character.color}
                      defaultImage={character.defaultImage}
                          featured={index === 0}
                    />
                  ))}
                </div>
              </section>
              
                  {/* Featured Characters */}
              <section>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-600/20 ring-1 ring-white/10 flex items-center justify-center">
                          <Star className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Featured</h2>
                          <p className="text-gray-400">Special characters and scenarios</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  
                  {/* Pricing CTA Banner */}
                  <section className="mt-16 mb-8">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 shadow-lg"
                    >
                      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
                        <div className="mb-6 md:mb-0">
                          <h3 className="text-2xl font-bold text-white mb-2">Unlock Premium Features</h3>
                          <p className="text-indigo-100 max-w-xl">
                            Take your AI companion experience to the next level with our premium plans. 
                            Get access to advanced features and exclusive characters.
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link href="/pricing">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex justify-center items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                              View Pricing Plans
                            </motion.button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </section>
            </>
          )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
} 