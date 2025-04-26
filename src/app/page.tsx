'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, MeshDistortMaterial, Sphere } from '@react-three/drei'

// Animated sphere component for hero section
function AnimatedSphere() {
  const sphereRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = clock.getElapsedTime() * 0.15
      sphereRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1, 64, 64]} scale={1.8}>
        <MeshDistortMaterial 
          color="#4F46E5" 
          attach="material" 
          distort={0.4} 
          speed={2} 
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

// Feature card component
const FeatureCard = ({ icon, title, description, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 * index, duration: 0.5 }}
    viewport={{ once: true }}
    className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 p-8 hover:border-indigo-500/50 transition-all duration-300"
  >
    <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-600/20 rounded-full blur-2xl" />
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </motion.div>
)

// Features list with improved descriptions
const features = [
  {
    title: 'Advanced Voice Interaction',
    description: 'Engage in natural, fluid conversations with AI characters that respond with emotion and personality.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    )
  },
  {
    title: 'Immersive Video Calls',
    description: 'Experience face-to-face interactions with stunning visual quality and realistic expressions.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: 'Custom Character Creation',
    description: 'Build AI personalities with unique traits, knowledge, and behaviors using our intuitive creation tools.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: 'Memory & Learning',
    description: 'Characters remember your conversations and adapt to your preferences over time.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  {
    title: 'Cross-platform Access',
    description: 'Connect with your AI companions from any device, anywhere – web, mobile, or desktop.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: 'Privacy & Security',
    description: 'End-to-end encryption and strict data protection policies ensure your conversations remain private.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  }
]

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9])
  
  // Redirect to explore page if user is logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/explore')
    }
  }, [isLoading, user, router])
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full opacity-30 animate-ping"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-l-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero section with 3D element */}
      <motion.div 
        className="relative min-h-screen flex items-center px-6 lg:px-8"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-900/40 to-black/80" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-950/50 border border-indigo-800/50 mb-8 backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 mr-2">
                <span className="animate-ping absolute h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-sm text-indigo-300">Next generation AI companion</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white"
            >
              Bring your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">AI companions</span> to life
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-xl leading-8 text-gray-300 max-w-xl"
            >
              Create unique AI characters with personalities, memories, and emotions. 
              Talk to them using voice or video calls for a truly immersive experience.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
            >
              <Link
                href="/create"
                className="relative group overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
              >
                <span className="relative z-10">Create Your Character</span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute top-0 left-0 w-40 h-40 -ml-20 -mt-20 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              
              <Link href="/explore" className="group text-base font-semibold text-gray-200 flex items-center">
                <span>Explore Gallery</span>
                <svg 
                  className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </motion.div>
          </div>
          
          <div className="hidden lg:block h-[600px]">
            <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
              <ambientLight intensity={0.5} />
              <AnimatedSphere />
              <Environment preset="city" />
            </Canvas>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        >
          <span className="text-sm text-gray-400 mb-2">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
            <motion.div 
              animate={{ 
                y: [0, 12, 0],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 bg-white rounded-full mt-1.5"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Features section */}
      <div className="py-24 sm:py-32 bg-gradient-to-b from-black/0 to-black/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-950/50 border border-indigo-800/50 mb-8 backdrop-blur-sm"
            >
              <span className="text-sm text-indigo-300">Cutting-edge technology</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              Redefining AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Interactions</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-6 text-lg leading-8 text-gray-300"
            >
              Our platform brings together the most advanced AI technologies to create companions that feel real, 
              respond naturally, and form authentic connections.
            </motion.p>
          </div>
          
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-8 sm:gap-y-10 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard 
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials/Call to action section */}
      <div className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-gray-900/30 to-black/80" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to meet your digital companion?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Join thousands of users already creating meaningful connections with AI characters.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="relative group overflow-hidden rounded-full bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg hover:shadow-white/20 transition-all duration-300"
              >
                <span className="relative z-10">Get Started Free</span>
                <span className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link href="/pricing" className="text-base font-semibold text-gray-200 flex items-center">
                <span>See Pricing</span>
                <svg 
                  className="ml-2 w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 