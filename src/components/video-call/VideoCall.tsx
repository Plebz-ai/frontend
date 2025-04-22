'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { createWebSocketClient } from '../../lib/websocket'
import { Character } from '../../lib/api'
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

type CallState = 'idle' | 'connecting' | 'connected' | 'error' | 'ended'

interface VideoCallProps {
  character: Character
  onClose: () => void
}

export default function VideoCall({ character, onClose }: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const { startRecording, stopRecording, isRecordingSupported } = useSpeechRecognition()

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const clientId = Math.random().toString(36).substring(7)
    
    wsClientRef.current = createWebSocketClient(
      (data) => {
        if (data.type === 'video') {
          handleVideoData(data.content)
        } else if (data.type === 'call_state') {
          setCallState(data.content.state)
        } else if (data.type === 'error') {
          setError(data.content.message)
          setCallState('error')
        }
      },
      () => {
        setIsConnected(true)
        setCallState('connected')
      },
      () => {
        setIsConnected(false)
        setCallState('error')
        setError('Connection lost. Please try again.')
      }
    )

    wsClientRef.current.connect(character.id.toString(), clientId)

    return () => {
      cleanup()
    }
  }, [character.id])

  const cleanup = () => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
    setCallState('idle')
  }

  const handleVideoData = (content: any) => {
    if (!content || !videoRef.current) return
    
    // If content is a base64 string, convert to Blob
    if (typeof content === 'string') {
      const byteCharacters = atob(content)
      const byteArrays = []
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      
      const blob = new Blob(byteArrays, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      
      videoRef.current.src = url
      
      // Clean up the URL when video is loaded
      videoRef.current.onloadeddata = () => {
        URL.revokeObjectURL(url)
      }
    } 
    // If content is a Blob URL or data URL, use directly
    else if (content.url) {
      videoRef.current.src = content.url
    }
  }

  const startLocalVideo = async () => {
    try {
      setCallState('connecting')
      
      // Request camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      streamRef.current = stream
      
      // Display the local video feed
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Send a message to start streaming
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('start_stream', { 
          character_id: character.id,
          video_enabled: true,
          audio_enabled: true
        })
      }
      
      setIsStreaming(true)
      setCallState('connected')
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Could not access camera or microphone. Please check permissions.')
      setCallState('error')
    }
  }

  const endCall = () => {
    cleanup()
    onClose()
  }

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
      
      // Notify server of mute state change
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('stream_config', {
          audio_enabled: !isMuted
        })
      }
    }
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
      
      // Notify server of video state change
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('stream_config', {
          video_enabled: !isVideoOff
        })
      }
    }
  }

  const handleStartRecording = async () => {
    if (isRecording) return
    
    setIsRecording(true)
    
    try {
      const audioData = await startRecording()
      if (audioData && wsClientRef.current) {
        wsClientRef.current.sendMessage('audio', { data: Array.from(audioData) })
      }
    } catch (error) {
      console.error('Recording error:', error)
      setError('Could not access microphone')
    } finally {
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    stopRecording()
    setIsRecording(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Video Call with {character.name}
          </h2>
          <button
            onClick={endCall}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <FaPhoneSlash className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
          {callState === 'idle' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startLocalVideo}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                Start Video Call
              </button>
            </div>
          ) : callState === 'connecting' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-xl">Connecting...</div>
            </div>
          ) : callState === 'error' ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-4">
              <div className="text-red-400">
                <p className="text-xl font-semibold mb-2">Connection Error</p>
                <p>{error || "Could not establish video call"}</p>
                <button
                  onClick={startLocalVideo}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Local video preview */}
          {isStreaming && (
            <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center">
                  <FaVideoSlash className="w-8 h-8 text-white opacity-70" />
                </div>
              )}
            </div>
          )}
        </div>

        {isStreaming && (
          <div className="flex justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className={`p-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              {isMuted ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVideo}
              className={`p-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 ${
                isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              {isVideoOff ? <FaVideoSlash className="w-5 h-5" /> : <FaVideo className="w-5 h-5" />}
            </motion.button>
            
            {isRecordingSupported && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`p-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 ${
                  isRecording ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isRecording ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 