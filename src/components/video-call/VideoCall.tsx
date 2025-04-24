'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createWebSocketClient } from '../../lib/websocket'
import { Character } from '../../lib/api'
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaVideoSlash, FaPaperPlane, FaSpinner, FaSmile, FaComments, FaTimesCircle } from 'react-icons/fa'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

type CallState = 'idle' | 'connecting' | 'connected' | 'error' | 'ended'

interface Message {
  id: string
  sender: 'user' | 'character'
  content: string
  timestamp: number
}

interface VideoCallProps {
  character: Character
  onClose: () => void
  sessionId?: string // Optional sessionId to maintain the same chat session
  initialMessages?: Message[] // Optional initial messages from CharacterChat
}

export default function VideoCall({ character, onClose, sessionId, initialMessages = [] }: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [usingDummyVideo, setUsingDummyVideo] = useState(true)
  
  // Chat state - make showChat true by default
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { startRecording, stopRecording, isRecordingSupported } = useSpeechRecognition()
  
  // Auto-start video call when component mounts
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (callState === 'idle') {
        startLocalVideo();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Log initialMessages when component mounts
  useEffect(() => {
    console.log('Video call started with session ID:', sessionId);
    console.log('Initial messages loaded:', initialMessages.length);
    if (initialMessages.length > 0) {
      console.log('First message:', initialMessages[0]?.content);
      console.log('Last message:', initialMessages[initialMessages.length - 1]?.content);
    }
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, showChat]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    const clientId = Math.random().toString(36).substring(7)
    
    wsClientRef.current = createWebSocketClient(
      (data) => {
        console.log('Received websocket data:', data.type);
        if (data.type === 'video') {
          handleVideoData(data.content)
        } else if (data.type === 'call_state') {
          setCallState(data.content.state)
        } else if (data.type === 'error') {
          setError(data.content.message)
          setCallState('error')
        } else if (data.type === 'chat') {
          setMessages((prev) => [...prev, data.content])
          setIsTyping(false)
        } else if (data.type === 'typing') {
          setIsTyping(true)
        } else if (data.type === 'chat_history') {
          // Handle receiving chat history from the server
          if (data.content && Array.isArray(data.content.messages)) {
            console.log('Received chat history:', data.content.messages.length, 'messages');
            // Use chat history from server if we didn't receive initialMessages
            if (initialMessages.length === 0) {
              console.log('Using chat history from server since no initial messages were provided');
              setMessages(data.content.messages);
            }
          }
        }
      },
      () => {
        setIsConnected(true)
        setCallState('connected')
        console.log('WebSocket connected successfully')
        
        // If no initial messages were provided and we have a sessionId,
        // explicitly request chat history
        if (initialMessages.length === 0 && sessionId) {
          console.log('No initial messages provided but sessionId exists, requesting chat history');
          wsClientRef.current?.sendMessage('get_chat_history', { 
            character_id: character.id,
            session_id: sessionId
          });
        }
      },
      () => {
        setIsConnected(false)
        setCallState('error')
        setError('Connection lost. Please try again.')
        console.error('WebSocket connection lost')
      }
    )

    // Connect with sessionId if provided
    console.log('Connecting to WebSocket with sessionId:', sessionId)
    wsClientRef.current.connect(
      character.id.toString(), 
      clientId,
      sessionId // This will maintain chat history with the main chat interface
    )

    return () => {
      cleanup()
    }
  }, [character.id, sessionId, initialMessages.length])

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
    
    // Real video data received, turn off dummy video
    setUsingDummyVideo(false)
    
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
      
      console.log('Requesting camera access...')
      
      // First set up the video element
      const videoElement = document.getElementById('localVideoElement') as HTMLVideoElement
      console.log('Local video element found:', !!videoElement)
      
      // Request camera and microphone with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      console.log('Camera access granted, setting up stream')
      
      streamRef.current = stream
      
      // Mark streaming as active first, which ensures the video element is visible
      setIsStreaming(true)
      
      // Short timeout to make sure the element is fully rendered
      setTimeout(() => {
        // Try to use the ref first, as it's more reliable
        if (localVideoRef.current) {
          console.log('Using React ref to set video stream')
          localVideoRef.current.srcObject = stream
          localVideoRef.current.play()
            .then(() => console.log('Local video started via ref'))
            .catch(err => console.error('Error playing via ref:', err))
        } 
        // Fall back to direct DOM access
        else if (videoElement) {
          console.log('Using DOM element to set video stream')
          videoElement.srcObject = stream
          videoElement.play()
            .then(() => console.log('Local video started via DOM'))
            .catch(err => console.error('Error playing via DOM:', err))
        } else {
          console.error('Could not find video element by any method')
        }
      }, 100)
      
      // Send a message to start streaming
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('start_stream', { 
          character_id: character.id,
          video_enabled: true,
          audio_enabled: true
        })
      }
      
      // For testing, start dummy video immediately
      setUsingDummyVideo(true)
      
      setCallState('connected')
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Could not access camera or microphone. Please check permissions.')
      setCallState('error')
    }
  }

  const endCall = () => {
    console.log('Ending call and cleaning up resources')
    cleanup()
    onClose()
    
    // Add a small delay and then refresh the page
    setTimeout(() => {
      console.log('Refreshing page to update chat history')
      window.location.reload()
    }, 100)
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

  const toggleChat = () => {
    setShowChat(!showChat)
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const handleStartRecording = async () => {
    console.log("Recording started");
    if (isRecording) return
    
    setIsRecording(true)
    
    try {
      console.log("Awaiting startRecording()");
      const audioData = await startRecording()
      console.log("Audio data received:", audioData ? `Yes, length: ${audioData.length}` : "No");
      
      if (audioData && wsClientRef.current) {
        console.log("WebSocket client available:", !!wsClientRef.current);
        
        // Convert Uint8Array to base64 string
        console.log("Converting to base64");
        const binary = Array.from(audioData).map(byte => String.fromCharCode(byte)).join('')
        const base64String = btoa(binary)
        console.log("Base64 string created, length:", base64String.length);
        
        console.log("Sending via WebSocket");
        const success = wsClientRef.current.sendMessage('audio', { data: base64String })
        console.log("WebSocket send result:", success ? "Success" : "Failed");
      } else {
        console.log("No audio data or WebSocket client is null. Audio data:", !!audioData, "WebSocket:", !!wsClientRef.current);
      }
    } catch (error) {
      console.error('Recording error:', error)
      setError('Could not access microphone')
    } finally {
      setIsRecording(false)
      console.log("Recording ended");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl p-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Video Call with {character.name}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={toggleChat}
              className={`p-2 ${showChat ? 'bg-indigo-600' : 'bg-gray-700'} text-white rounded-full hover:bg-indigo-500`}
              aria-label={showChat ? "Hide chat" : "Show chat"}
            >
              <FaComments className="w-5 h-5" />
            </button>
            <button
              onClick={endCall}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <FaPhoneSlash className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main video area */}
          <div className={`relative ${showChat ? 'w-2/3' : 'w-full'} transition-all duration-300 bg-black rounded-lg overflow-hidden`}>
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
              <>
                {/* Replace video with direct HTML when using dummy video */}
                {usingDummyVideo ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-pink-600 animate-gradient-x flex flex-col items-center justify-center p-8">
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                      DEMO MODE
                    </div>
                    
                    <div className="text-4xl font-bold text-white mb-6 text-center shadow-text">
                      AI Character Video Demo
                    </div>
                    
                    <div className="w-32 h-32 rounded-full mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-6xl font-bold shadow-lg animate-pulse">
                      {character.name.charAt(0)}
                    </div>
                    
                    <div className="text-2xl font-semibold text-white mb-8 text-center">
                      {character.name}
                    </div>
                    
                    <div className="flex space-x-3 mb-6">
                      <div className="h-3 w-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-3 w-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <div className="h-3 w-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                    </div>
                    
                    <div className="text-lg text-white opacity-80 max-w-md text-center">
                      This is a placeholder for the AI-generated video that will appear here in production.
                    </div>
                    
                    <div className="absolute bottom-3 right-3 text-white text-sm opacity-70">
                      {new Date().toLocaleTimeString()}
                    </div>
                    
                    {/* Animated background elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute rounded-full bg-white opacity-20 animate-float"
                          style={{
                            width: `${20 + Math.random() * 50}px`,
                            height: `${20 + Math.random() * 50}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${5 + Math.random() * 10}s`,
                            animationDelay: `${Math.random() * 5}s`
                          }}
                        />
                      ))}
                    </div>
                    
                    <style jsx global>{`
                      @keyframes gradient-x {
                        0% { background-position: 0% 50% }
                        50% { background-position: 100% 50% }
                        100% { background-position: 0% 50% }
                      }
                      .animate-gradient-x {
                        background-size: 200% 200%;
                        animation: gradient-x 15s ease infinite;
                      }
                      .shadow-text {
                        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                      }
                      @keyframes float {
                        0% { transform: translateY(0px) translateX(0px); }
                        50% { transform: translateY(-20px) translateX(10px); }
                        100% { transform: translateY(0px) translateX(0px); }
                      }
                      .animate-float {
                        animation: float 8s ease-in-out infinite;
                      }
                    `}</style>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </>
            )}
            
            {/* Local video preview - Always render the container, but conditionally apply CSS */}
            <div className={`absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-indigo-500 shadow-lg z-50 ${isStreaming ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
              <video
                id="localVideoElement"
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              ></video>
              {isVideoOff && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center">
                  <FaVideoSlash className="w-8 h-8 text-white opacity-60" />
                </div>
              )}
              <div className="absolute top-0 left-0 w-full bg-black bg-opacity-50 px-2 py-1 text-sm text-white">
                You 
              </div>
            </div>
            
            {/* Call controls */}
            {callState === 'connected' && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                    isMuted ? 'bg-red-600' : 'bg-gray-800'
                  } text-white`}
                >
                  {isMuted ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
                </button>
                <button
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                  onTouchStart={handleStartRecording}
                  onTouchEnd={handleStopRecording}
                  className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                    isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-800'
                  } text-white`}
                >
                  <FaMicrophone className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-green-400'}`} />
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                    isVideoOff ? 'bg-red-600' : 'bg-gray-800'
                  } text-white`}
                >
                  {isVideoOff ? <FaVideoSlash className="w-5 h-5" /> : <FaVideo className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {/* Chat panel */}
          {showChat && (
            <div className="w-1/3 flex flex-col ml-4 bg-[#151722] rounded-lg overflow-hidden border border-[#343a4f]">
              <div className="p-3 border-b border-[#292d3e] flex justify-between items-center">
                <h3 className="text-white font-medium">Chat</h3>
                <button onClick={toggleChat} className="text-gray-400 hover:text-white">
                  <FaTimesCircle className="w-4 h-4" />
                </button>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" 
                   style={{ backgroundColor: '#0d0f17' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-4">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isFirstInGroup = index === 0 || messages[index-1].sender !== message.sender;
                    
                    return (
                      <div
                        key={message.id}
                        className={`${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'} flex`}
                      >
                        {message.sender === 'character' && isFirstInGroup && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium mr-2 mt-1 shadow-md">
                            {character.name.charAt(0)}
                          </div>
                        )}
                        {message.sender === 'character' && !isFirstInGroup && (
                          <div className="w-8 mr-2"></div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`relative max-w-[85%] ${
                            message.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tl-2xl rounded-tr-md rounded-br-md rounded-bl-2xl shadow-lg'
                              : 'bg-[#202536] text-gray-100 rounded-tr-2xl rounded-tl-md rounded-br-2xl rounded-bl-md shadow border border-[#343a4f]'
                          } px-4 py-3`}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                          <div className={`mt-1 text-xs flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-center gap-1.5 opacity-70`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                )}

                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex justify-start mt-2"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                          {character.name.charAt(0)}
                        </div>
                        <div className="bg-[#202536] border border-[#343a4f] rounded-2xl px-4 py-2 shadow-md">
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} className="h-1" />
              </div>
              
              {/* Chat input */}
              <div className="p-3 border-t border-[#292d3e]">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                  <div className="relative flex-1 bg-[#202536] rounded-2xl shadow-inner">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      disabled={!isConnected}
                      placeholder={isConnected ? `Message ${character.name}...` : "Connecting..."}
                      className="w-full p-3 pl-4 pr-10 bg-transparent text-white border border-[#343a4f] rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none min-h-[48px] max-h-[120px] placeholder-gray-500"
                      rows={1}
                    />
                    
                    <button
                      type="button"
                      className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <FaSmile className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!isConnected || !inputMessage.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow"
                    aria-label="Send message"
                  >
                    {isTyping ? (
                      <FaSpinner className="w-5 h-5 animate-spin" />
                    ) : (
                      <FaPaperPlane className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 