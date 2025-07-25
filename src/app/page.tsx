'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, MeshDistortMaterial, Sphere } from '@react-three/drei'
import { Sparkles, Zap, Heart, BookOpen, MessageCircle, Video, Mic, Users, Star, ArrowRight, Play, Brain, Cpu, Network, Infinity, Shield, Globe, Award, Clock, Check, TrendingUp, Lock, Bot, User, Crown, Rocket, Target, Eye, Headphones, Camera, Smartphone, Monitor, Tablet, MousePointer, MousePointer2, Fingerprint, Wifi, Satellite, Plus } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'

// Floating particles component for modern background effect - Client-side only
const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }))
    setParticles(generatedParticles)
  }, [])

  if (!isClient) {
    return null // Don't render anything on server side
  }
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-30 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// Enhanced feature showcase with 3D tilt effect
const FeatureShowcase = ({ features, currentFeature }: { features: any[], currentFeature: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.6 }}
    className="max-w-4xl mx-auto perspective-1000"
  >
    <motion.div 
      className="glass-card p-8 rounded-3xl text-center relative overflow-hidden"
      whileHover={{ 
        rotateY: 5,
        rotateX: 5,
        scale: 1.02
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
      
      <div className="relative z-10">
        <motion.div 
          className="flex justify-center mb-6"
          key={currentFeature}
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="icon-modern relative group">
            {features[currentFeature].icon}
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
          </div>
        </motion.div>
        
        <motion.h3 
          key={`title-${currentFeature}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold mb-3 text-gradient"
        >
          {features[currentFeature].title}
        </motion.h3>
        
        <motion.p 
          key={`desc-${currentFeature}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-gray-300 text-lg"
        >
          {features[currentFeature].description}
        </motion.p>
      </div>
    </motion.div>
  </motion.div>
)

// Enhanced journey card with advanced hover effects
const JourneyCard = ({ card, index }: { card: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.2 }}
    viewport={{ once: true }}
    className="group relative"
  >
    <Link href={card.href}>
      <motion.div 
        className={`card-modern h-full cursor-pointer relative overflow-hidden`}
        whileHover={{ 
          scale: 1.05,
          rotateY: 2,
          rotateX: 2
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        
        {/* Floating elements */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-teal-400 rounded-full"
          />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${card.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
            whileHover={{ rotate: 5 }}
          >
            {card.icon}
          </motion.div>
          
          <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient transition-colors">
            {card.title}
          </h3>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            {card.description}
          </p>
          
          <ul className="space-y-2 mb-6">
            {card.features.map((feature: string, featureIndex: number) => (
              <motion.li 
                key={featureIndex} 
                className="flex items-center text-sm text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: featureIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-3"
                  whileHover={{ scale: 1.5 }}
                />
                {feature}
              </motion.li>
            ))}
          </ul>
          
          <motion.div 
            className="flex items-center text-teal-400 font-medium group-hover:translate-x-2 transition-transform"
            whileHover={{ x: 5 }}
          >
            Explore Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  </motion.div>
)

// AI-Generated journey card component
const AIJourneyCard = ({ icon, title, description, subtitle, index, href, gradient, features }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 * index, duration: 0.8, ease: "easeOut" }}
    viewport={{ once: true }}
    className="group relative overflow-hidden rounded-3xl card-modern hover:scale-105 transition-all duration-700"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-700`} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative z-10">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/25">
        {icon}
      </div>
      <div className="mb-6">
        <p className="text-sm font-semibold text-purple-400 mb-3 tracking-wider uppercase letter-spacing-2">{subtitle}</p>
        <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-gradient transition-all duration-500 leading-tight">{title}</h3>
      </div>
      <p className="text-gray-300 mb-8 leading-relaxed text-lg">{description}</p>
      
      {features && (
        <div className="mb-8 space-y-3">
          {features.map((feature: string, idx: number) => (
            <div key={idx} className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      )}
      
      <Link 
        href={href}
        className="inline-flex items-center text-purple-400 hover:text-purple-300 font-semibold group-hover:translate-x-3 transition-all duration-500"
      >
        Begin your journey
        <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-500" />
      </Link>
    </div>
  </motion.div>
)

// AI-Generated communication mode card
const AICommunicationCard = ({ icon, title, description, features, index, gradient }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 * index, duration: 0.8, ease: "easeOut" }}
    viewport={{ once: true }}
    className="group relative overflow-hidden rounded-3xl card-modern hover:scale-105 transition-all duration-700"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-700`} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative z-10">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/25">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gradient transition-colors duration-500">{title}</h3>
      <p className="text-gray-300 mb-6 leading-relaxed">{description}</p>
      <div className="space-y-3">
        {features.map((feature: string, idx: number) => (
          <div key={idx} className="flex items-center text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            <Check className="w-4 h-4 mr-3 text-purple-400 flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
)

// AI-Generated testimonial card
const AITestimonialCard = ({ name, role, content, avatar, rating }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    viewport={{ once: true }}
    className="group relative rounded-3xl card-modern"
  >
    <div className="relative z-10">
      <div className="flex items-center mb-6">
        <img src={avatar} alt={name} className="w-14 h-14 rounded-full mr-4 border-2 border-purple-500/50 group-hover:border-purple-400 transition-colors duration-500" />
        <div>
          <h4 className="font-bold text-lg text-white">{name}</h4>
          <p className="text-sm text-purple-400">{role}</p>
        </div>
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" />
        ))}
      </div>
    </div>
  </motion.div>
)

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentFeature, setCurrentFeature] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Hyper-Realistic Avatars",
      description: "Lifelike characters that breathe, move, and react",
      gradient: "from-teal-500 to-blue-500"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Personalized Experiences",
      description: "AI that remembers you and adapts to your personality",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Dynamic Storytelling",
      description: "Characters with evolving goals, memories, and relationships",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Real-time Streaming",
      description: "Instant voice and video streaming with minimal latency",
      gradient: "from-pink-500 to-red-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Emotional Intelligence",
      description: "AI that understands and responds to human emotions",
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: <Infinity className="w-8 h-8" />,
      title: "Unlimited Conversations",
      description: "No limits on conversation length or complexity",
      gradient: "from-orange-500 to-yellow-500"
    }
  ];
  
  const aiJourneys = [
    {
      icon: <Bot className="w-8 h-8 text-white" />,
      title: "Create & Customize",
      description: "Bring your dream character to life with our intuitive creation tools. Define their personality, backstory, and appearance.",
      href: "/create",
      gradient: "from-purple-600 to-pink-600",
      features: [
        "Rich personality traits",
        "Customizable avatars",
        "Unique voice selection"
      ]
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Interact & Connect",
      description: "Engage in lifelike conversations through chat, voice, or video. Experience AI that truly listens and understands.",
      href: "/characters",
      gradient: "from-blue-600 to-teal-600",
      features: [
        "Real-time voice chat",
        "Expressive video calls",
        "Context-aware conversations"
      ]
    },
    {
      icon: <Rocket className="w-8 h-8 text-white" />,
      title: "Explore & Discover",
      description: "Browse a universe of AI characters created by our community. Find companions, mentors, and friends.",
      href: "/explore",
      gradient: "from-yellow-600 to-orange-600",
      features: [
        "Community character hub",
        "Featured character showcases",
        "Advanced search & filtering"
      ]
    }
  ];

  const stats = [
    { icon: Users, number: "10K+", label: "Active Users" },
    { icon: Bot, number: "5K+", label: "Characters Created" },
    { icon: MessageCircle, number: "1M+", label: "Messages Exchanged" },
    { icon: Star, number: "4.9/5", label: "User Rating" },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background Effects */}
        <div className="bg-effect"></div>
        <FloatingParticles />
        
        {/* Mouse follower effect */}
        <motion.div
          className="fixed w-4 h-4 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full pointer-events-none z-50 mix-blend-difference"
          animate={{
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
        
        {/* Hero Section */}
        <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 rounded-full glass-card mb-8 group cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-5 h-5 mr-2 text-teal-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-sm font-medium">The Future of AI Interaction</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              >
                <motion.span 
                  className="text-gradient"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    backgroundSize: "200% 200%",
                    backgroundImage: "linear-gradient(135deg, #00d4aa 0%, #0099cc 50%, #7c3aed 100%)"
                  }}
                >
                  Aletheia
                </motion.span>
                <br />
                <span className="text-white">AI Platform</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Create, interact, and connect with AI characters through voice, video, and chat. 
                Experience conversations that feel truly human.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                <Link href="/explore">
                  <motion.button 
                    className="btn-primary flex items-center group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Exploring
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <motion.button 
                  className="glass-card px-8 py-4 rounded-2xl flex items-center group hover-lift"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Quick Actions Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-[-2rem]">
                <Link href="/create" className="btn-primary flex items-center gap-2 px-6 py-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">
                  <Plus className="w-5 h-5" />
                  Create Character
                </Link>
                <Link href="/characters" className="btn-primary flex items-center gap-2 px-6 py-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md">
                  <MessageCircle className="w-5 h-5" />
                  Start Chat
                </Link>
                <Link href="/characters" className="btn-primary flex items-center gap-2 px-6 py-4 rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md">
                  <Video className="w-5 h-5" />
                  Start Video Call
                </Link>
              </div>
            </section>

            {/* Enhanced Feature Showcase */}
            <FeatureShowcase features={features} currentFeature={currentFeature} />
            </div>
        </section>

        {/* Journey Cards Section */}
        <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Choose Your <span className="text-gradient">Journey</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Three unique paths to explore the future of AI interaction
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {aiJourneys.map((card, index) => (
                <JourneyCard key={index} card={card} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center group"
                  >
                    <motion.div 
                      className="glass-card p-6 rounded-2xl group-hover:scale-105 transition-all duration-500"
                      whileHover={{ y: -5 }}
                    >
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>
                      <motion.div 
                        className="text-3xl md:text-4xl font-bold text-gradient mb-2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-gray-300 font-medium">
                        {stat.label}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Footer placeholder */}
        <footer className="relative z-10 py-10 text-center text-gray-500">
          <p>&copy; 2024 Aletheia AI. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
} 