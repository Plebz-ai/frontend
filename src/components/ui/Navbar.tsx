'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/lib/auth'
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Sparkles,
  Crown,
  Zap,
  Shield,
  Globe,
  Star,
  TrendingUp,
  Award,
  Bot,
  MessageCircle,
  Video,
  Users,
  Home,
  Compass,
  Plus,
  Heart,
  BookOpen,
  Clock,
  ArrowRight,
  ChevronDown,
  Check,
  Infinity,
  Lock,
  Eye,
  Headphones,
  Camera,
  Smartphone,
  Monitor,
  Tablet,
  Sparkles as SparklesIcon,
  Zap as ZapIcon,
  Brain,
  Cpu,
  Fingerprint,
  Satellite,
  Wifi
} from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsMenuOpen(false)
  }

  const features = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Voice Conversations",
      description: "Natural, real-time voice interactions",
      color: "from-teal-400 to-blue-500",
      gradient: "from-teal-500/20 to-blue-500/20"
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: "Video Calls",
      description: "Face-to-face conversations with AI",
      color: "from-blue-500 to-purple-500",
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Character Creation",
      description: "Design your perfect AI companion",
      color: "from-purple-500 to-pink-500",
      gradient: "from-purple-500/20 to-pink-500/20"
    }
  ]

  const solutions = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Break into the Future",
      description: "Experience cutting-edge AI technology",
      href: "/explore",
      gradient: "from-teal-400 to-blue-500"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Reconnect with Past",
      description: "Revive memories and conversations",
      href: "/characters",
      gradient: "from-amber-400 to-orange-500"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Learn from Legends",
      description: "Gain wisdom from great minds",
      href: "/create",
      gradient: "from-purple-400 to-pink-500"
    }
  ]

  const advancedFeatures = [
    {
      icon: <Cpu className="w-5 h-5" />,
      title: "Advanced AI Processing",
      description: "State-of-the-art neural networks",
      color: "from-teal-400 to-blue-500"
    },
    {
      icon: <Fingerprint className="w-5 h-5" />,
      title: "Biometric Security",
      description: "Enterprise-grade voice recognition",
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: <Satellite className="w-5 h-5" />,
      title: "Global Infrastructure",
      description: "Distributed servers worldwide",
      color: "from-purple-500 to-pink-500"
    }
  ]

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'nav-modern' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group" aria-label="Go to homepage">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              whileHover={{ rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <motion.span 
              className="text-xl font-bold text-gradient group-hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Aletheia
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Features Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('features')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <motion.button 
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors py-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Features</span>
                <motion.div
                  animate={{ rotate: activeDropdown === 'features' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {activeDropdown === 'features' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-80"
                  >
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-blue-500/5" />
                      
                      <div className="relative z-10">
                        <div className="grid gap-4">
                          {features.map((feature, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                            >
                              <motion.div 
                                className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                                whileHover={{ rotate: 5 }}
                              >
                                {feature.icon}
                              </motion.div>
                              <div>
                                <h4 className="font-semibold text-white mb-1 group-hover:text-gradient transition-colors">
                                  {feature.title}
                                </h4>
                                <p className="text-sm text-gray-400">{feature.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Advanced features preview */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-3 gap-2">
                            {advancedFeatures.map((feature, index) => (
                              <motion.div
                                key={index}
                                className="text-center p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mx-auto mb-1`}>
                                  {feature.icon}
                                </div>
                                <span className="text-xs text-gray-400">{feature.title}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Solutions Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <motion.button 
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors py-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Solutions</span>
                <motion.div
                  animate={{ rotate: activeDropdown === 'solutions' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {activeDropdown === 'solutions' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-80"
                  >
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
                      
                      <div className="relative z-10">
                        <div className="grid gap-4">
                          {solutions.map((solution, index) => (
                            <Link key={index} href={solution.href}>
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                whileHover={{ x: 5 }}
                              >
                                <motion.div 
                                  className={`w-10 h-10 rounded-lg bg-gradient-to-r ${solution.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                                  whileHover={{ rotate: 5 }}
                                >
                                  {solution.icon}
                                </motion.div>
                                <div>
                                  <h4 className="font-semibold text-white mb-1 group-hover:text-gradient transition-colors">
                                    {solution.title}
                                  </h4>
                                  <p className="text-sm text-gray-400">{solution.description}</p>
                                </div>
                                <motion.div
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  initial={{ x: -10 }}
                                  animate={{ x: 0 }}
                                >
                                  <ArrowRight className="w-4 h-4 text-teal-400" />
                                </motion.div>
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/explore" className="text-gray-300 hover:text-white transition-colors py-2">Explore</Link>
            <Link href="/characters" className="text-gray-300 hover:text-white transition-colors py-2">Characters</Link>
            <Link href="/create" className="text-gray-300 hover:text-white transition-colors py-2">Create</Link>
            
            <Link href="/pricing">
              <motion.span 
                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Pricing
              </motion.span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <motion.button 
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl glass-card hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Search className="w-5 h-5 text-gray-300" />
            </motion.button>

            {/* Notifications */}
            <motion.button 
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl glass-card hover:bg-white/10 transition-colors relative"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="w-5 h-5 text-gray-300" />
              <motion.div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 glass-card px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center"
                    whileHover={{ rotate: 5 }}
                  >
                    <User className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="text-sm font-medium text-white hidden sm:block">
                    {user?.name || 'User'}
                  </span>
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 glass-card rounded-2xl p-2"
                    >
                      <div className="space-y-1">
                        <Link href="/profile">
                          <motion.button 
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <User className="w-5 h-5 text-gray-300" />
                            <span className="text-white">Profile</span>
                          </motion.button>
                        </Link>
                        <Link href="/settings">
                          <motion.button 
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Settings className="w-5 h-5 text-gray-300" />
                            <span className="text-white">Settings</span>
                          </motion.button>
                        </Link>
                        <div className="border-t border-white/10 my-2"></div>
                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <LogOut className="w-5 h-5 text-gray-300" />
                          <span className="text-white">Logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <motion.button 
                    className="text-gray-300 hover:text-white transition-colors px-4 py-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link href="/signup">
                  <motion.button 
                    className="btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden glass-card p-2 rounded-xl hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-card border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-400 mb-3">Features</div>
                {features.map((feature, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                      {feature.icon}
                    </div>
                    <div>
                      <div className="font-medium text-white">{feature.title}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-400 mb-3">Solutions</div>
                {solutions.map((solution, index) => (
                  <Link key={index} href={solution.href}>
                    <motion.div 
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center">
                        {solution.icon}
                      </div>
                      <div>
                        <div className="font-medium text-white">{solution.title}</div>
                        <div className="text-sm text-gray-400">{solution.description}</div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              <div className="space-y-2">
                <Link href="/explore">
                  <motion.div 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <Compass className="w-5 h-5 text-gray-300" />
                    <span className="text-white">Explore</span>
                  </motion.div>
                </Link>
                <Link href="/pricing">
                  <motion.div 
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <Crown className="w-5 h-5 text-gray-300" />
                    <span className="text-white">Pricing</span>
                  </motion.div>
                </Link>
              </div>

              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="pt-4 space-y-3">
                  <Link href="/login">
                    <motion.button 
                      className="w-full glass-card py-3 rounded-xl text-white hover:bg-white/10 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Login
                    </motion.button>
                  </Link>
                  <Link href="/signup">
                    <motion.button 
                      className="w-full btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Get Started
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
} 