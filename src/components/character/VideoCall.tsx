// This file is a placeholder. Main video call logic is in components/video-call/VideoCall.tsx
import React, { useEffect, useRef, useState } from 'react'
import SimplePeer from 'simple-peer'
import { Character } from '../../lib/api'

interface VideoCallProps {
  character: Character
  onClose: () => void
}

export default function VideoCall({ character, onClose }: VideoCallProps) {
  const [isConnecting, setIsConnecting] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<SimplePeer.Instance | null>(null)

  useEffect(() => {
    const startVideoCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Initialize peer connection
        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream
        })

        peer.on('signal', data => {
          // Here you would send the signal data to your backend
          console.log('Signal data:', data)
        })

        peer.on('stream', remoteStream => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
        })

        peer.on('connect', () => {
          setIsConnecting(false)
        })

        peerRef.current = peer

      } catch (err) {
        console.error('Failed to start video call:', err)
      }
    }

    startVideoCall()

    return () => {
      peerRef.current?.destroy()
      const tracks = localVideoRef.current?.srcObject as MediaStream
      tracks?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream
    stream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
    })
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream
    stream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled
    })
    setIsVideoOff(!isVideoOff)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Video Call with {character.name}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full ${
                isMuted ? 'bg-red-500' : 'bg-gray-700'
              } hover:bg-opacity-80`}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
              </svg>
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${
                isVideoOff ? 'bg-red-500' : 'bg-gray-700'
              } hover:bg-opacity-80`}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isVideoOff ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
} 