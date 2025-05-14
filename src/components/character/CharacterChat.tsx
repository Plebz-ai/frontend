'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createWebSocketClient, getWebSocketUrlForCharacter } from '../../lib/websocket'
import { Character } from '../../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaSpinner, FaVolumeUp, FaVideo, FaChevronRight, FaSmile } from 'react-icons/fa'
import VideoCall from '../../components/video-call/VideoCall'

interface Message {
  id: string
  sender: 'user' | 'character'
  content: string
  timestamp: number
}

interface CharacterChatProps {
  character: Character
  onSessionIdChange?: (sessionId: string, messages: Message[]) => void
  onMessagesChange?: (messages: Message[]) => void
}

// Sample quick replies (customize based on character type)
const QUICK_REPLIES = [
  "Tell me about yourself",
  "What can you do?",
  "How are you feeling today?",
  "Tell me a story"
];

export default function CharacterChat({ character, onSessionIdChange, onMessagesChange }: CharacterChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [audioMessages, setAudioMessages] = useState<{[key: string]: Uint8Array}>({})
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [showVideo, setShowVideo] = useState(false)
  const [missedMessages, setMissedMessages] = useState<Message[]>([])
  const [wasDisconnected, setWasDisconnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [reconnectBlocked, setReconnectBlocked] = useState(false)

  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const videoCallRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // WebRTC setup
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Generate a persistent session ID and client ID per character
  const sessionIdRef = useRef<string>('')
  const clientIdRef = useRef<string>('')

  const { startRecording, stopRecording, isRecordingSupported } = useSpeechRecognition();

  useEffect(() => {
    window.lastCharacter = character;
    console.warn('[CharacterChat] Mounted for character.id:', character.id, 'sessionId:', sessionIdRef.current)
    // Generate or load sessionId and clientId for this character
    const savedSessionId = localStorage.getItem(`chat-session-${character.id}`)
    if (savedSessionId) {
      sessionIdRef.current = savedSessionId
    } else {
      sessionIdRef.current = `session-${character.id}-${Math.random().toString(36).substring(7)}-${Date.now()}`
      localStorage.setItem(`chat-session-${character.id}`, sessionIdRef.current)
    }
    // Generate or load clientId for this character
    const savedClientId = localStorage.getItem(`chat-client-${character.id}`)
    if (savedClientId) {
      clientIdRef.current = savedClientId
    } else {
      clientIdRef.current = Math.random().toString(36).substring(7)
      localStorage.setItem(`chat-client-${character.id}`, clientIdRef.current)
    }
    if (onSessionIdChange) {
      onSessionIdChange(sessionIdRef.current, messages)
    }
    return () => {
      console.warn('[CharacterChat] Unmounted for character.id:', character.id, 'sessionId:', sessionIdRef.current)
    }
  }, [character.id, onSessionIdChange])

  // Notify parent when messages change
  useEffect(() => {
    if (onMessagesChange && messages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Add detailed logging for WebSocket connection events
  useEffect(() => {
    // Setup WebSocket client for this character
    if (!character || !clientIdRef.current || !sessionIdRef.current) return;

    console.log('[CharacterChat] character object:', character);

    // Clean up previous client if any
    wsClientRef.current?.disconnect();

    wsClientRef.current = createWebSocketClient(
      character,
      clientIdRef.current,
      sessionIdRef.current,
      (data) => {
        console.log('WebSocket message received:', data);
        if (data.type === 'text_response') {
          setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'character',
            content: data.content,
            timestamp: Date.now(),
          }]);
          setIsTyping(false);
          setShowQuickReplies(false);
          if (data.error) {
            setConnectionError(
              typeof data.error === 'string'
                ? data.error
                : (data.error.llm2 || data.error.llm1 || 'Something went wrong.')
            );
          }
        } else if (data.type === 'chat') {
          setMessages((prev) => [...prev, data.content]);
          setIsTyping(false);
          setShowQuickReplies(false);
        } else if (data.type === 'typing') {
          setIsTyping(true);
        } else if (data.type === 'audio') {
          handleAudioMessage(data.content);
        } else if (data.type === 'error') {
          setConnectionError(data.content?.message || data.message || 'Unknown error');
        } else {
          // Ignore unknown types, do not throw
          console.warn('[WS] Unknown message type:', data.type, data);
        }
      },
      () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
      },
      () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionError('WebSocket disconnected');
      },
      (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket error');
      }
    );

    return () => {
      wsClientRef.current?.disconnect();
    };
  }, [character.id]);

  // Effect to trigger reconnect on reconnectAttempts change
  useEffect(() => {
    if (reconnectAttempts > 0 && reconnectAttempts < 5 && !isConnected && !reconnectBlocked) {
      wsClientRef.current?.disconnect(); // Ensure previous socket is closed
    }
  }, [reconnectAttempts, isConnected, reconnectBlocked, wsClientRef]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

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
    e.preventDefault();
    if (!inputMessage.trim() || !wsClientRef.current) return;

    // Debug: Alert if not custom
    if (!(character.is_custom === true || (typeof character.id === 'string' && character.id.startsWith('custom-')))) {
      alert('This character is NOT detected as custom. Custom chat path will not be used.');
    }

    // The Go backend expects: { id, sender, content, timestamp }
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    wsClientRef.current.sendMessage('chat', message);
    setMessages(prev => [...prev, message]);
    setInputMessage('');
    setIsTyping(true);
    setShowQuickReplies(false);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply)
    inputRef.current?.focus()
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
        // Convert Uint8Array to base64 string
        const binary = Array.from(audioData).map(byte => String.fromCharCode(byte)).join('')
        const base64String = btoa(binary)
        wsClientRef.current.sendMessage('audio', { data: base64String })
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

  const handleVideoCallClick = () => {
    setShowVideo(true)
  }

  const handleCloseVideoCall = () => {
    setShowVideo(false)
  }

  const handleVoiceCallClick = () => {
    alert('Voice call feature is not implemented yet.');
  };

  return (
    <div className="flex flex-col h-full relative bg-[#0e0f13]">
      {connectionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/30 border border-red-800 text-red-100 text-sm rounded-lg m-4 flex items-start z-50"
        >
          <div className="flex-shrink-0 mr-2 mt-0.5">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium mb-1">Connection Error</p>
            <p>{connectionError}</p>
            <button 
              className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors duration-200"
              onClick={() => {
                if (wsClientRef.current) {
                  wsClientRef.current.disconnect();
                }
              }}
            >
              Reconnect
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Video Call Modal */}
      {showVideo && (
        <VideoCall 
          character={character} 
          onClose={handleCloseVideoCall}
          sessionId={sessionIdRef.current}
          initialMessages={messages}
        />
      )}
      
      {/* Status Bar */}
      <div className="bg-[#151722] py-2.5 px-4 flex justify-between items-center border-b border-[#292d3e]">
        <div className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleVoiceCallClick}
            className="flex items-center px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0b0e] transition-all duration-200 shadow"
            title="Voice call is not yet implemented. Only text and audio messages are supported."
          >
            <FaMicrophone className="mr-1.5 text-xs" />
            <span className="font-medium">Voice Call</span>
          </button>
          <button
            type="button"
            onClick={handleVideoCallClick}
            className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0b0e] transition-all duration-200 shadow"
          >
            <FaVideo className="mr-1.5 text-xs" />
            <span className="font-medium">Video Call</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Area with subtle gradient background */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto py-4 px-4 md:px-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ 
          backgroundImage: 'linear-gradient(to bottom, #0d0f17, #12141f)',
          backgroundAttachment: 'fixed'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Hello there!</h2>
            <p className="text-gray-400 max-w-md mb-6">Start your conversation with {character.name} or try one of the suggested topics below</p>
            
            {/* Quick Reply Buttons in a more engaging grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_REPLIES.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="px-4 py-2.5 bg-[#1e2133] hover:bg-[#2a2f45] text-left text-white rounded-xl border border-[#343a4f] transition-colors flex justify-between items-center group"
                >
                  <span>{reply}</span>
                  <FaChevronRight className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isFirstInGroup = index === 0 || messages[index-1].sender !== message.sender;
              const isLastInGroup = index === messages.length - 1 || messages[index+1]?.sender !== message.sender;
              
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
                    className={`relative max-w-[85%] md:max-w-[70%] ${
                      message.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tl-2xl rounded-tr-md rounded-br-md rounded-bl-2xl shadow-lg'
                        : 'bg-[#202536] text-gray-100 rounded-tr-2xl rounded-tl-md rounded-br-2xl rounded-bl-md shadow border border-[#343a4f]'
                    } px-4 py-3`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                    <div className={`mt-1 text-xs flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-center gap-1.5 opacity-70`}>
                      {formatTimestamp(message.timestamp)}
                      {message.sender === 'character' && audioMessages[message.id] && (
                        <button
                          onClick={() => playAudio(message.id)}
                          disabled={currentAudio === message.id}
                          className={`p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors ${
                            currentAudio === message.id ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-400'
                          }`}
                          aria-label="Play audio"
                        >
                          <FaVolumeUp className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                  {message.sender === 'user' && isFirstInGroup && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium ml-2 mt-1 shadow-md">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {message.sender === 'user' && !isFirstInGroup && (
                    <div className="w-8 ml-2"></div>
                  )}
                </div>
              );
            })}

            {/* Quick Reply Suggestions in a more engaging horizontal scroll */}
            {messages.length > 0 && showQuickReplies && messages[messages.length - 1].sender === 'character' && (
              <div className="flex overflow-x-auto py-2 space-x-2 no-scrollbar mt-2 pb-1">
                {QUICK_REPLIES.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-2 bg-[#1e2133] hover:bg-[#2a2f45] text-sm text-white rounded-lg border border-[#343a4f] whitespace-nowrap flex-shrink-0 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
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
        )}
      </div>

      {/* Message Input Area - Modern Style */}
      <div className="p-3 border-t border-[#292d3e] bg-[#151722]">
        {connectionError && (
          <div className="mb-2 text-red-400 text-sm font-semibold">
            {connectionError}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto relative">
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
          
          <div className="flex space-x-2">
            {isRecordingSupported && (
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!isConnected}
                className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-500' 
                    : 'bg-[#202536] text-gray-300 hover:bg-[#2a2f45] border border-[#343a4f]'
                }`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
              </button>
            )}
            
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
          </div>
        </form>
      </div>

      {/* Missed Messages Banner */}
      {missedMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-yellow-900/30 border border-yellow-800 text-yellow-100 text-sm rounded-lg m-4 flex items-center z-50"
        >
          <span className="font-medium mr-2">You have {missedMessages.length} missed message(s) delivered after reconnect.</span>
          <button
            className="ml-auto px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded-lg"
            onClick={() => setMissedMessages([])}
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {reconnectBlocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/30 border border-red-800 text-red-100 text-sm rounded-lg m-4 flex items-center z-50"
        >
          <span className="font-medium mr-2">Connection lost. Please click Reconnect to try again.</span>
          <button
            className="ml-auto px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded-lg"
            onClick={() => {
              setReconnectAttempts(0);
              setReconnectBlocked(false);
              wsClientRef.current?.disconnect();
            }}
          >
            Reconnect
          </button>
        </motion.div>
      )}
    </div>
  )
}