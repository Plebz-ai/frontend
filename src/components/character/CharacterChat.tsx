'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createWebSocketClient } from '../../lib/websocket'
import { Character } from '../../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaSpinner, FaVolumeUp, FaVideo } from 'react-icons/fa'
import VideoCall from '../../components/video-call/VideoCall'

interface Message {
  id: string
  sender: 'user' | 'character'
  content: string
  timestamp: number
}

interface CharacterChatProps {
  character: Character
}

export default function CharacterChat({ character }: CharacterChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [audioMessages, setAudioMessages] = useState<{[key: string]: Uint8Array}>({})
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  
  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const videoCallRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  
  const audioPlayer = useAudioPlayer()
  const { startRecording, stopRecording, isRecordingSupported } = useSpeechRecognition()

  // WebRTC setup
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  useEffect(() => {
    const clientId = Math.random().toString(36).substring(7)
    
    try {
      console.log('Creating WebSocket client...');
      
      wsClientRef.current = createWebSocketClient(
        (data) => {
          if (data.type === 'chat') {
            setMessages((prev) => [...prev, data.content])
            setIsTyping(false)
          } else if (data.type === 'typing') {
            setIsTyping(true)
          } else if (data.type === 'audio') {
            handleAudioMessage(data.content)
          } else if (data.type === 'error') {
            setConnectionError(data.content.message)
            console.error('WebSocket returned error:', data.content);
          } else if (data.type === 'speech_text') {
            // Speech recognition result from backend
            setInputMessage(data.content.text)
          }
        },
        () => {
          console.log('WebSocket connected successfully');
          setIsConnected(true)
          setConnectionError(null)
        },
        () => {
          console.log('WebSocket disconnected');
          setIsConnected(false)
          setConnectionError('Connection lost. Please refresh the page.')
        }
      )

      if (wsClientRef.current) {
        console.log('Connecting to WebSocket...');
        wsClientRef.current.connect(character.id.toString(), clientId)
      } else {
        console.error('Failed to create WebSocket client');
        setConnectionError('Failed to create WebSocket client')
      }
    } catch (error) {
      console.error('Error initializing WebSocket:', error)
      setConnectionError('Failed to connect to server. Please try again later.')
    }

    return () => {
      if (wsClientRef.current) {
        try {
          wsClientRef.current.disconnect()
        } catch (error) {
          console.error('Error disconnecting WebSocket:', error)
        }
      }
    }
  }, [character.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAudioMessage = (content: any) => {
    if (content.data && content.messageId) {
      // Convert base64 to Uint8Array if necessary
      let audioData: Uint8Array
      if (typeof content.data === 'string') {
        const binaryString = atob(content.data)
        audioData = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i)
        }
      } else {
        // Assume it's already an array of numbers
        audioData = new Uint8Array(content.data)
      }
      
      setAudioMessages(prev => ({
        ...prev,
        [content.messageId]: audioData
      }))

      
      // Auto-play the audio if settings allow
      if (content.messageId && audioData.length > 0) {
        playAudio(content.messageId)
      }
    }
  }

  const playAudio = (messageId: string) => {
    const audioData = audioMessages[messageId]
    if (audioData) {
      setCurrentAudio(messageId)
      audioPlayer.play(audioData, () => {
        setCurrentAudio(null)
      })
    }
  }
  

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !wsClientRef.current) return

    const message: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    }

    wsClientRef.current.sendMessage('chat', message)
    setMessages(prev => [...prev, message])
    setInputMessage('')
    setIsTyping(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
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
      setConnectionError('Could not access microphone')
    } finally {
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    stopRecording()
    setIsRecording(false)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    // Initialize WebRTC
    const initWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (videoCallRef.current) {
          const videoElement = videoCallRef.current;
          videoElement.srcObject = stream;
        }

        const peerConnection = new RTCPeerConnection();
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnection.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        // Signaling logic here
        // Example: wsClientRef.current.sendMessage('offer', offer);

      } catch (error) {
        console.error('Error accessing media devices.', error);
      }
    };

    if (isVideoCallActive) {
      initWebRTC();
    }

    return () => {
      // Cleanup
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoCallActive]);

  useEffect(() => {
    if (videoCallRef.current && localStream) {
      const videoElement = videoCallRef.current;
      videoElement.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col h-full">
      {connectionError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md mb-4">
          <p className="font-medium">Connection Error</p>
          <p>{connectionError}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              if (wsClientRef.current) {
                wsClientRef.current.disconnect();
              }
              const clientId = Math.random().toString(36).substring(7);
              wsClientRef.current = createWebSocketClient(
                /* Same handlers as in useEffect */
                (data) => {
                  if (data.type === 'chat') {
                    setMessages((prev) => [...prev, data.content])
                    setIsTyping(false)
                  } else if (data.type === 'typing') {
                    setIsTyping(true)
                  } else if (data.type === 'audio') {
                    handleAudioMessage(data.content)
                  } else if (data.type === 'error') {
                    setConnectionError(data.content.message)
                    console.error('WebSocket returned error:', data.content);
                  } else if (data.type === 'speech_text') {
                    // Speech recognition result from backend
                    setInputMessage(data.content.text)
                  }
                },
                () => {
                  console.log('WebSocket connected successfully');
                  setIsConnected(true)
                  setConnectionError(null)
                },
                () => {
                  console.log('WebSocket disconnected');
                  setIsConnected(false)
                  setConnectionError('Connection lost. Please refresh the page.')
                }
              );
              wsClientRef.current.connect(character.id.toString(), clientId);
            }}
          >
            Reconnect
          </button>
        </div>
      )}
      
      {/* Simple Video Call Modal - For Debugging */}
      {isVideoCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Video Call with {character.name}</h2>
              <button 
                onClick={() => {
                  console.log('Closing video call');
                  setIsVideoCallActive(false);
                }}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-gray-900 rounded-lg mb-4">
              <video ref={videoCallRef} autoPlay playsInline className="w-full h-full" />
              {remoteStream && <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full" />}
            </div>
            <div className="flex justify-center space-x-4">
              <button 
                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
                onClick={() => setIsVideoCallActive(false)}
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Chat UI */}
      <div className="bg-indigo-100 p-3 flex justify-between items-center mb-2 rounded-t-lg">
        <div className="text-sm font-medium">
          Status: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            console.log('Video call button clicked');
            setIsVideoCallActive(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none shadow-md"
        >
          <FaVideo className="mr-2" />
          <span className="font-medium">Start Video Call</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Start a conversation with {character.name}</p>
            <button
              onClick={() => setIsVideoCallActive(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none"
            >
              <FaVideo className="mr-2" />
              <span>Start Video Call</span>
            </button>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-xs md:max-w-md overflow-hidden ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none'
                } px-4 py-3 shadow-sm`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="mt-1 text-xs text-right opacity-70">
                  {formatTimestamp(message.timestamp)}
                  {message.sender === 'character' && audioMessages[message.id] && (
                    <button
                      onClick={() => playAudio(message.id)}
                      disabled={currentAudio === message.id}
                      className="ml-2 text-xs p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                      aria-label="Play audio"
                    >
                      <FaVolumeUp className={`${currentAudio === message.id ? 'text-blue-400' : 'text-gray-500'}`} />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          ))
        )}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              placeholder={isConnected ? `Message ${character.name}...` : "Connecting..."}
              className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
          </div>
          
          {isRecordingSupported && (
            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={!isConnected}
              className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
          )}
          
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </form>
      </div>
    </div>
  )
} 