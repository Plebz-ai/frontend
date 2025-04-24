'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Character, characterApi } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaCompass, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useSidebar } from '@/lib/sidebar-context'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { collapsed, setCollapsed, refreshTrigger, refreshCharacters } = useSidebar()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Group characters by time
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        const data = await characterApi.list()
        console.log('Characters from API:', data)
        setCharacters(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching characters:', err)
        setError('Failed to load characters')
      } finally {
        setLoading(false)
      }
    }

    fetchCharacters()
  }, [refreshTrigger])

  // Group characters by time period based on actual creation dates
  const todayChars = characters.filter(char => {
    const createdDate = new Date(char.created_at);
    return createdDate.toDateString() === today.toDateString();
  });
  
  const yesterdayChars = characters.filter(char => {
    const createdDate = new Date(char.created_at);
    return createdDate.toDateString() === yesterday.toDateString();
  });
  
  const thisWeekChars = characters.filter(char => {
    const createdDate = new Date(char.created_at);
    return createdDate > lastWeek && 
           createdDate.toDateString() !== today.toDateString() && 
           createdDate.toDateString() !== yesterday.toDateString();
  });
  
  const lastWeekChars = characters.filter(char => {
    const createdDate = new Date(char.created_at);
    return createdDate <= lastWeek;
  });

  // Filter characters based on search query
  const filteredCharacters = characters.filter(char => 
    char.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Add click outside handler for user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Character item component
  const CharacterItem = ({ character }: { character: Character }) => {
    const isActive = pathname === `/characters/${character.id}`
    const avatarUrl = character.avatar_url || '/placeholder-avatar.png'
    
    return (
      <Link href={`/characters/${character.id}`}>
        <div 
          className={`flex items-center py-2 px-3 ${
            isActive 
              ? 'text-white' 
              : 'text-white hover:bg-[#22232a]/20'
          } transition-all duration-150 cursor-pointer`}
        >
          <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden mr-3">
            <img 
              src={avatarUrl} 
              alt={character.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to first letter if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-full h-full bg-[#301e63] flex items-center justify-center text-white font-bold text-sm hidden">
              {character.name.charAt(0).toUpperCase()}
            </div>
          </div>
          {isMounted && !collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium truncate text-white">{character.name}</p>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // Time section component
  const TimeSection = ({ title, characters }: { title: string, characters: Character[] }) => {
    if (characters.length === 0) return null
    
    return (
      <div className="mb-5">
        {isMounted && !collapsed && <h3 className="text-sm font-normal text-gray-300 mb-1 px-3">{title}</h3>}
        <div>
          {characters.map(character => (
            <CharacterItem key={character.id} character={character} />
          ))}
        </div>
      </div>
    )
  }

  // Only show sidebar on character pages
  if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname.includes('/forgot-password')) {
    return null
  }

  // Don't render anything until client-side hydration is complete
  if (!isMounted) {
    return (
      <div className={`h-screen flex flex-col bg-[#121316] transition-all duration-300 w-[340px]`} />
    )
  }

  return (
    <motion.div 
      className={`h-screen fixed top-0 left-0 flex flex-col bg-[#121316] transition-all duration-300 ${
        collapsed ? 'w-[80px]' : 'w-[340px]'
      }`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* App logo and collapse button */}
      <div className="flex items-center justify-between px-5 py-5">
        {!collapsed && (
          <Link href="/explore" className="text-white font-bold text-xl tracking-tight">
            character.ai
          </Link>
        )}
        <div className="flex items-center">
          <button 
            onClick={() => refreshCharacters()} 
            className="p-1.5 text-gray-400 hover:text-white transition-colors mr-1"
            title="Refresh characters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
          </button>
        </div>
      </div>
      
      {/* Create and discover buttons */}
      <div className="px-4 py-3">
        <Link 
          href="/create" 
          className={`flex items-center ${collapsed ? 'justify-center' : ''} py-3 px-5 mb-3 bg-[#1D1F25] hover:bg-[#2a2b31] text-white rounded-full transition-all`}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-3">
            <FaPlus size={16} className="text-white" />
          </div>
          {!collapsed && <span className="font-medium">Create</span>}
        </Link>
        
        <Link 
          href="/characters" 
          className={`flex items-center ${collapsed ? 'justify-center' : ''} py-3 px-5 mb-3 bg-[#1D1F25] hover:bg-[#2a2b31] text-white rounded-lg transition-all`}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          {!collapsed && <span className="font-medium">Catalogue</span>}
        </Link>
        
        <Link 
          href="/explore" 
          className={`flex items-center ${collapsed ? 'justify-center' : ''} py-3 px-5 bg-[#1D1F25] hover:bg-[#2a2b31] text-white rounded-lg transition-all`}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
            </svg>
          </div>
          {!collapsed && <span className="font-medium">Explore</span>}
        </Link>
      </div>
      
      {/* Search box */}
      {!collapsed && (
        <div className="px-4 mb-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search for Characters"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1D1F25] text-gray-300 pl-11 pr-4 py-2.5 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-gray-600 placeholder-gray-500 transition-all"
            />
          </div>
        </div>
      )}
      
      {/* Character list by time periods */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <AnimatePresence>
          {loading ? (
            <motion.div 
              className="flex justify-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          ) : error ? (
            <motion.div 
              className="text-red-400 text-sm text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          ) : searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredCharacters.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No characters found</p>
              ) : (
                filteredCharacters.map(character => (
                  <CharacterItem key={character.id} character={character} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ staggerChildren: 0.07 }}
            >
              <TimeSection title="Today" characters={todayChars} />
              <TimeSection title="Yesterday" characters={yesterdayChars} />
              <TimeSection title="This Week" characters={thisWeekChars} />
              <TimeSection title="Last Week" characters={lastWeekChars} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer links */}
      {!collapsed && (
        <div className="px-5 py-3 text-xs text-gray-400">
          <div className="flex space-x-2">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
          </div>
          
          <Link 
            href="/upgrade" 
            className="flex items-center justify-center mt-4 py-3 bg-[#1D1F25] hover:bg-[#28293a]/70 text-white rounded-full transition-all border border-[#3f4046]"
          >
            <span className="font-medium">Upgrade to c.ai</span>
            <span className="text-blue-400 font-bold ml-1">+</span>
          </Link>
        </div>
      )}
      
      {/* User profile */}
      <div className="p-4 mt-1 border-t border-[#1f2026]" ref={userMenuRef}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[#301e63] flex items-center justify-center text-white font-bold text-sm">
            {collapsed ? 'N' : 'S'}
          </div>
          
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Sauhard Gupta'}</p>
            </div>
          )}
          
          {!collapsed && (
            <button 
              className="p-1.5 rounded-full text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        
        {/* User dropdown menu */}
        {!collapsed && showUserMenu && (
          <div className="absolute bottom-20 left-4 right-4 bg-[#1D1F25] rounded-lg shadow-lg border border-gray-800 overflow-hidden z-50">
            <button 
              onClick={logout} 
              className="w-full px-4 py-3 flex items-center text-white hover:bg-[#2a2c36] transition-colors text-left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
} 