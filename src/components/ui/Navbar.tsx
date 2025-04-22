'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleLogout = () => {
    setShowUserDropdown(false)
    logout()
    router.push('/login')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Navbar items with hover animations
  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link 
      href={href} 
      className="relative group px-3 py-2"
    >
      <span className="relative z-10 text-gray-300 group-hover:text-white text-sm font-medium transition-colors duration-200">
        {children}
      </span>
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/60 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="relative text-xl font-bold text-white overflow-hidden group">
                <span className="z-10 relative">AI Characters</span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-600 opacity-0 group-hover:opacity-80 blur-lg group-hover:blur-md transition-all duration-500 scale-110 group-hover:scale-100"></span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <NavLink href="/">Home</NavLink>
              {isAuthenticated && (
                <>
                  <NavLink href="/characters">Characters</NavLink>
                  <NavLink href="/create">Create Character</NavLink>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/70 text-white px-4 py-2 rounded-full transition-all duration-200 border border-transparent hover:border-indigo-500/30"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-sm font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800/80 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg border border-gray-700 z-50"
                    >
                      <div className="py-2 px-4 border-b border-gray-700 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                        <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600/20 transition-colors duration-150"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600/20 transition-colors duration-150"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors duration-150"
                        >
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login"
                  className="text-gray-300 hover:text-white text-sm font-medium relative overflow-hidden group"
                >
                  <span className="relative z-10">Login</span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>
                <Link 
                  href="/signup"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-gray-800/50 hover:bg-gray-700 p-2 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden bg-gray-900/90 backdrop-blur-lg overflow-hidden"
          >
            <div className="pt-2 pb-3 space-y-1 px-2">
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/characters"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Characters
                  </Link>
                  <Link
                    href="/create"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Character
                  </Link>
                </>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700 bg-gray-800/30">
              {isAuthenticated ? (
                <div className="px-3 space-y-1">
                  <div className="px-3 py-2 flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-sm font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-medium text-white">{user?.name}</div>
                      <div className="text-sm font-medium text-gray-400 truncate max-w-[200px]">{user?.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-2">
                    <Link
                      href="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 flex flex-col space-y-3">
                  <Link
                    href="/login"
                    className="bg-transparent border border-gray-700 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-md text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
} 