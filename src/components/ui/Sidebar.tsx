'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Compass, 
  Plus, 
  MessageCircle, 
  Video, 
  Users, 
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
  Heart,
  BookOpen,
  Clock,
  ArrowRight,
  ChevronRight,
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
  Brain,
  Cpu,
  Fingerprint,
  Satellite,
  Wifi,
  Target,
  Rocket,
  MousePointer,
  MousePointer2,
  User
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const navigationItems = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: Home,
          description: 'Overview and analytics'
        },
        {
          name: 'Explore',
          href: '/explore',
          icon: Compass,
          description: 'Discover AI characters'
        },
        {
          name: 'Create',
          href: '/create',
          icon: Plus,
          description: 'Build your AI character'
        }
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          name: 'Start Chat',
          href: '/characters',
          icon: MessageCircle,
          description: 'Text/voice conversations',
          badge: 'New'
        },
        {
          name: 'Start Video Call',
          href: '/characters',
          icon: Video,
          description: 'Video call with AI',
          badge: 'Beta'
        },
        {
          name: 'Character Chat',
          href: '/characters',
          icon: Users,
          description: 'Text-based conversations'
        }
      ]
    },
    {
      title: 'Advanced',
      items: [
        {
          name: 'AI Processing',
          href: '/ai-processing',
          icon: Cpu,
          description: 'Advanced neural networks',
          premium: true
        },
        {
          name: 'Biometric Security',
          href: '/security',
          icon: Fingerprint,
          description: 'Voice recognition security',
          premium: true
        },
        {
          name: 'Global Infrastructure',
          href: '/infrastructure',
          icon: Satellite,
          description: 'Distributed servers',
          premium: true
        }
      ]
    }
  ];

  const quickActions = [
    {
      name: 'Create Character',
      href: '/create',
      icon: Plus,
      gradient: 'from-teal-400 to-blue-500'
    },
    {
      name: 'Start Chat',
      href: '/characters',
      icon: MessageCircle,
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      name: 'Start Video Call',
      href: '/characters',
      icon: Video,
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const recentCharacters = [
    {
      name: 'Future You',
      avatar: 'FY',
      href: '/characters/future-you',
      lastActive: '2 min ago'
    },
    {
      name: 'Einstein',
      avatar: 'AE',
      href: '/characters/einstein',
      lastActive: '5 min ago'
    },
    {
      name: 'Creative Coach',
      avatar: 'CC',
      href: '/characters/creative-coach',
      lastActive: '1 hour ago'
    }
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.aside
      className={`sidebar-modern h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-80'
      }`}
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <motion.div 
          className="p-6 border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
          >
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">Aletheia</h1>
                  <p className="text-xs text-gray-400">AI Platform</p>
          </div>
              </motion.div>
            )}
            
            <motion.button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-8 h-8 rounded-lg glass-card hover:bg-white/10 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>

        {/* User Profile */}
        {isAuthenticated && user && !isCollapsed && (
          <motion.div 
            className="p-4 border-b border-white/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-colors">
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <User className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {user.name || 'User'}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {user.email || 'user@example.com'}
                </p>
          </div>
              <motion.div 
                className="w-2 h-2 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        {!isCollapsed && (
          <motion.div 
            className="p-4 border-b border-white/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <motion.div
                    className="flex items-center space-x-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-colors cursor-pointer group"
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
            <motion.div 
                      className={`w-8 h-8 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      whileHover={{ rotate: 5 }}
            >
                      <action.icon className="w-4 h-4 text-white" />
            </motion.div>
                    <span className="text-sm font-medium text-white group-hover:text-gradient transition-colors">
                      {action.name}
                    </span>
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
            </motion.div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {navigationItems.map((section, sectionIndex) => (
            <motion.div
                key={section.title}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + sectionIndex * 0.1 }}
              >
                {!isCollapsed && (
                  <motion.h3 
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + sectionIndex * 0.1 }}
            >
                    {section.title}
                  </motion.h3>
                )}
                
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.name}>
                      <Link href={item.href}>
                        <motion.div
                          className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-500/30'
                              : 'glass-card hover:bg-white/5'
                          }`}
                          whileHover={{ x: 5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + sectionIndex * 0.1 + itemIndex * 0.05 }}
                        >
                          {/* Active indicator */}
                          {isActive(item.href) && (
                            <motion.div
                              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-blue-500"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          
                          <motion.div 
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isActive(item.href)
                                ? 'bg-gradient-to-r from-teal-400 to-blue-500'
                                : 'bg-white/10 group-hover:bg-white/20'
                            }`}
                            whileHover={{ rotate: 5, scale: 1.1 }}
                          >
                            <item.icon className={`w-4 h-4 ${
                              isActive(item.href) ? 'text-white' : 'text-gray-300'
                            }`} />
            </motion.div>
                          
                          {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium truncate ${
                                  isActive(item.href) ? 'text-white' : 'text-gray-300 group-hover:text-white'
                                }`}>
                                  {item.name}
                                </span>
                                {item.badge && (
                                  <motion.span 
                                    className="px-2 py-1 text-xs bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1 + itemIndex * 0.1 }}
                                  >
                                    {item.badge}
                                  </motion.span>
                                )}
                                {item.premium && (
            <motion.div
                                    className="w-4 h-4"
                                    whileHover={{ scale: 1.2, rotate: 360 }}
                                    transition={{ duration: 0.5 }}
            >
                                    <Crown className="w-4 h-4 text-yellow-400 fill-current" />
                                  </motion.div>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {item.description}
                              </p>
                  </div>
              )}
            </motion.div>
                      </Link>
                    </div>
                  ))}
      </div>
              </motion.div>
            ))}
          </div>
        </div>
      
        {/* Recent Characters */}
        {!isCollapsed && (
          <motion.div 
            className="p-4 border-t border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Recent Characters
            </h3>
            <div className="space-y-2">
              {recentCharacters.map((character, index) => (
                <Link key={index} href={character.href}>
                  <motion.div
                    className="flex items-center space-x-3 p-2 rounded-lg glass-card hover:bg-white/5 transition-colors cursor-pointer group"
                    whileHover={{ x: 3, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + index * 0.1 }}
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-xs font-semibold text-white group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: 5 }}
                    >
                      {character.avatar}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-gradient transition-colors">
                        {character.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {character.lastActive}
                      </p>
          </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
          )}
          
        {/* Footer */}
        <motion.div 
          className="p-4 border-t border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link href="/settings">
                <motion.div
                  className="flex items-center space-x-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-colors cursor-pointer"
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div 
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
                    whileHover={{ rotate: 5 }}
            >
                    <Settings className="w-4 h-4 text-gray-300" />
                  </motion.div>
                  {!isCollapsed && (
                    <span className="text-sm font-medium text-gray-300">Settings</span>
                  )}
                </motion.div>
              </Link>
              
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-colors"
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center"
                  whileHover={{ rotate: 5 }}
                >
                  <LogOut className="w-4 h-4 text-white" />
                </motion.div>
                {!isCollapsed && (
                  <span className="text-sm font-medium text-gray-300">Logout</span>
                )}
              </motion.button>
        </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login">
                <motion.button
                  className="w-full glass-card py-3 rounded-xl text-white hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
            >
                  {!isCollapsed ? 'Login' : <User className="w-5 h-5 mx-auto" />}
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button
                  className="w-full btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {!isCollapsed ? 'Get Started' : <Plus className="w-5 h-5 mx-auto" />}
                </motion.button>
              </Link>
          </div>
        )}
        </motion.div>
      </div>
    </motion.aside>
  );
} 