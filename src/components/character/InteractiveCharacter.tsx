import React, { useRef, useState, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Loader, Box, useAnimations } from '@react-three/drei'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import * as THREE from 'three'

// Fallback cube component when model fails to load
const FallbackCube = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })
  
  return (
    <Box 
      ref={meshRef}
      args={[1.5, 1.5, 1.5]} 
      position={[0, 0, 0]}
    >
      <meshStandardMaterial 
        color="#4c00b0" 
        metalness={0.7}
        roughness={0.2}
      />
    </Box>
  )
}

// STL Model loader component
const STLModel = ({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], onError }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loader = new STLLoader()
    
    loader.load(
      url,
      (geometry) => {
        // Center the geometry
        geometry.computeBoundingBox()
        const center = new THREE.Vector3()
        geometry.boundingBox?.getCenter(center)
        geometry.center()
        
        setGeometry(geometry)
        setLoading(false)
      },
      // Progress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      // Error callback
      (error) => {
        console.error('An error happened loading STL:', error)
        onError(error)
        setLoading(false)
      }
    )
  }, [url, onError])
  
  useFrame((state) => {
    if (meshRef.current) {
      // Add a subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1
    }
  })
  
  if (!geometry) return null
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <meshStandardMaterial 
        color="#ffffff" 
        metalness={0.2}
        roughness={0.5}
      />
    </mesh>
  )
}

// Keep the FBX Model loader for backward compatibility
const FBXModel = ({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], onError }) => {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const modelRef = useRef<THREE.Group>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loader = new FBXLoader()
    
    loader.load(
      url,
      (fbx) => {
        // Center the model horizontally but keep vertical position as specified
        const box = new THREE.Box3().setFromObject(fbx)
        const center = box.getCenter(new THREE.Vector3())
        fbx.position.x = -center.x
        // We don't reset Y position to allow our explicit position to work
        // fbx.position.y = -center.y
        fbx.position.z = -center.z
        
        // Scale down the model if it's too big
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 10) {
          const scaleFactor = 10 / maxDim
          fbx.scale.multiplyScalar(scaleFactor)
        }
        
        setModel(fbx)
        setLoading(false)
      },
      // Progress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      // Error callback
      (error) => {
        console.error('An error happened loading FBX:', error)
        onError(error)
        setLoading(false)
      }
    )
  }, [url, onError])
  
  useFrame((state) => {
    if (modelRef.current) {
      // Apply fixed position instead of floating animation
      modelRef.current.position.y = position[1];
    }
  })
  
  if (!model) return null
  
  return (
    <primitive 
      ref={modelRef} 
      object={model} 
      position={position}
      rotation={rotation}
      scale={scale} 
    />
  )
}

export default function InteractiveCharacter() {
  const [modelFailed, setModelFailed] = useState(false)
  
  // Point to your FBX model
  const modelUrl = '/models/man.fbx' 
  
  // Customize these props for your specific model
  const modelProps = {
    scale: 0.14, // Same scale
    position: [-0.2, -2.4, 0], // Slightly higher than before
    rotation: [0, 0, 0] // Remove rotation to keep model upright
  }

  const handleModelError = () => {
    setModelFailed(true)
  }

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, -3, 10], fov: 30 }}>
        <ambientLight intensity={0.9} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.2} />
        <directionalLight position={[-5, 5, 5]} intensity={1} color="#ffffff" />
        
        <Suspense fallback={null}>
          {!modelFailed ? (
            <FBXModel 
              url={modelUrl} 
              scale={modelProps.scale} 
              position={modelProps.position} 
              rotation={modelProps.rotation} 
              onError={handleModelError}
            />
          ) : (
            <FallbackCube />
          )}
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>
      
      <Loader />
      
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-black/60 px-2 py-1 rounded-full whitespace-nowrap z-10">
        Drag to interact
      </div>
    </div>
  )
} 