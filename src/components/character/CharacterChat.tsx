'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createWebSocketClient, getWebSocketUrlForCharacter, isCustomCharacter } from '../../lib/websocket'
import { Character } from '../../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaSpinner, FaVolumeUp, FaVideo, FaChevronRight, FaSmile } from 'react-icons/fa'
import VideoCall from '../../components/video-call/VideoCall'
import VoiceCall from '../video-call/VoiceCall'
import axios from 'axios'

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

const MAX_DISPLAY_MESSAGES = 30;

export default function CharacterChat({ character, onSessionIdChange, onMessagesChange }: CharacterChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [audioMessages, setAudioMessages] = useState<{[key: string]: Uint8Array}>({})
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [showVideo, setShowVideo] = useState(false)
  const [missedMessages, setMissedMessages] = useState<Message[]>([])
  const [wasDisconnected, setWasDisconnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [reconnectBlocked, setReconnectBlocked] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{[id: string]: 'up' | 'down' | 'flag' | null}>({});
  const [showSettings, setShowSettings] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const videoCallRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>('');
  const clientIdRef = useRef<string>('');

  // Add userId (mock for now, replace with real userId from auth)
  const userId = 1;

  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);

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

    console.log('[CharacterChat] Character object:', character);
    console.log('[CharacterChat] Is custom character?', 
      isCustomCharacter(character) ? 'YES (will use AI Layer)' : 'NO (will use Go backend)');

    // Clean up previous client if any
    wsClientRef.current?.disconnect();

    wsClientRef.current = createWebSocketClient(
      character,
      clientIdRef.current,
      sessionIdRef.current,
      (data) => {
        console.log('[CharacterChat] WebSocket message received:', data);
        
        // Handle errors first
        if (data.error) {
          console.error('[CharacterChat] Error received:', data.error);
          setConnectionError(
            typeof data.error === 'string'
              ? data.error
              : (data.error.llm2 || data.error.llm1 || data.error.connection || 'Something went wrong.')
          );
        }
        
        if (data.type === 'text_response') {
          // Response from AI Layer (orchestrator)
          setMessages((prev) => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'character',
            content: data.content,
            timestamp: Date.now(),
          }]);
          setIsTyping(false);
          setShowQuickReplies(false);
        } else if (data.type === 'chat') {
          // Response from Go backend
          setMessages((prev) => [...prev, data.content]);
          setIsTyping(false);
          setShowQuickReplies(false);
        } else if (data.type === 'typing') {
          setIsTyping(true);
        } else if (data.type === 'audio') {
          handleAudioMessage(data.content);
        } else if (data.type === 'text_response_stream') {
          // Partial chunk from AI Layer
          if (!streamingMessageId) {
            const id = Math.random().toString(36).substring(7);
            setStreamingMessageId(id);
            setStreamingMessage(data.content);
          } else {
            setStreamingMessage((prev) => (prev || '') + data.content);
          }
          setIsTyping(true);
          setShowQuickReplies(false);
        } else if (data.type === 'text_response_stream_end') {
          // End of stream, finalize message
          if (streamingMessageId && streamingMessage) {
            setMessages((prev) => [...prev, {
              id: streamingMessageId,
              sender: 'character',
              content: streamingMessage,
              timestamp: Date.now(),
            }]);
            setStreamingMessage(null);
            setStreamingMessageId(null);
          }
          setIsTyping(false);
          setShowQuickReplies(false);
        } else {
          // Ignore unknown types, do not throw
          console.warn('[CharacterChat] Unknown message type:', data.type, data);
        }
      },
      () => {
        console.log('[CharacterChat] Connected successfully');
        setIsConnected(true);
        setConnectionError(null);
      },
      () => {
        console.log('[CharacterChat] Disconnected');
        setIsConnected(false);
        setConnectionError('Disconnected from character');
      },
      (error) => {
        console.error('[CharacterChat] Error:', error);
        setConnectionError(`Connection error: ${error?.message || 'Unknown error'}`);
      }
    );

    return () => {
      wsClientRef.current?.disconnect();
    };
  }, [character?.id]);

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

  // Remove or comment out the code that fetches from /api/v1/messages
  // useEffect(() => {
  //   // Fetch persistent chat history from backend
  //   const fetchHistory = async () => {
  //     try {
  //       const res = await axios.get(`/api/v1/messages?characterId=${character.id}&sessionId=${sessionIdRef.current}&limit=${MAX_DISPLAY_MESSAGES}`);
  //       if (res.data && Array.isArray(res.data.messages)) {
  //         setMessages(res.data.messages);
  //         setHasMoreHistory(res.data.count > MAX_DISPLAY_MESSAGES);
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch chat history:', err);
  //     }
  //   };
  //   fetchHistory();
  // }, [character.id, onSessionIdChange]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsClientRef.current) return;

    // Create the message
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    if (!isConnected) {
      setConnectionError('Not connected to character service. Please try refreshing the page.');
      return;
    }

    setMessages(prev => [...prev, message]);
    setInputMessage('');
    setIsTyping(true);
    setShowQuickReplies(false);

    // Send to websocket/API, include chatStyle if set
    wsClientRef.current.sendMessage('chat', {
      ...message,
      chatStyle: userPreferences?.chatStyle || undefined,
    });

    try {
      await axios.post('/api/v1/messages', {
        sessionId: sessionIdRef.current,
        characterId: character.id,
        content: message.content,
        sender: 'user',
        chatStyle: userPreferences?.chatStyle || undefined,
      });
    } catch (err) {
      console.error('Failed to save message to backend:', err);
    }

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!reply.trim()) return;
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

  const handleVideoCallClick = () => {
    setShowVideo(true)
  }

  const handleCloseVideoCall = () => {
    setShowVideo(false)
  }

  const handleVoiceCallClick = () => {
    console.log('[CharacterChat] handleVoiceCallClick called');
    setShowVoiceCall(true);
  };

  const handleCloseVoiceCall = () => {
    console.log('[CharacterChat] handleCloseVoiceCall called');
    setShowVoiceCall(false);
  };

  // Add formatTimestamp helper
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleLoadMore = async () => {
    try {
      const res = await axios.get(`/api/v1/messages?characterId=${character.id}&sessionId=${sessionIdRef.current}&limit=100&offset=${messages.length}`);
      if (res.data && Array.isArray(res.data.messages)) {
        setMessages(prev => [...res.data.messages, ...prev]);
        setHasMoreHistory(res.data.count > messages.length + res.data.messages.length);
      }
    } catch (err) {
      console.error('Failed to load more history:', err);
    }
  };

  // Feedback handler
  const handleFeedback = async (messageId: string, type: 'up' | 'down' | 'flag') => {
    setFeedback(f => ({ ...f, [messageId]: type }));
    try {
      await axios.post('/api/v1/messages/feedback', {
        messageId,
        userId,
        feedbackType: type,
        timestamp: Date.now(),
      });
      // Optionally show a toast/confirmation
    } catch (err) {
      // Optionally show error toast
      setFeedback(f => ({ ...f, [messageId]: null }));
      console.error('Failed to send feedback:', err);
    }
  };

  // Fetch preferences on open
  const openSettings = async () => {
    setShowSettings(true);
    setPrefsError(null);
    try {
      const res = await axios.get('/api/user/preferences');
      setUserPreferences(res.data.preferences || {});
    } catch (err) {
      setPrefsError('Failed to load preferences');
    }
  };

  const savePreferences = async (prefs: any) => {
    setSavingPrefs(true);
    setPrefsError(null);
    try {
      await axios.post('/api/user/preferences', prefs);
      setUserPreferences(prefs);
      setShowSettings(false);
    } catch (err) {
      setPrefsError('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Add effect to apply theme
  useEffect(() => {
    if (!userPreferences?.theme) return;
    const root = document.documentElement;
    if (userPreferences.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [userPreferences?.theme]);

  // Focus management for settings modal
  useEffect(() => {
    if (showSettings && settingsModalRef.current) {
      settingsModalRef.current.focus();
    }
  }, [showSettings]);

  const closeSettings = () => {
    setShowSettings(false);
    setTimeout(() => {
      settingsButtonRef.current?.focus();
    }, 0);
  };

  return (
    <div className={`flex flex-col h-full relative bg-[#0e0f13] ${userPreferences?.theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
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
      
      {showVoiceCall && (
        <VoiceCall
          character={character}
          onClose={handleCloseVoiceCall}
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
        <button
          aria-label="Open user preferences"
          onClick={openSettings}
          style={{marginLeft: 8}}
          ref={settingsButtonRef}
          tabIndex={0}
        >
          ⚙️
        </button>
      </div>

      {/* Chat Messages Area with subtle gradient background */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto py-4 px-4 md:px-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ 
          backgroundImage: 'linear-gradient(to bottom, #0d0f17, #12141f)',
          backgroundAttachment: 'fixed'
        }}
        role="log"
        aria-live="polite"
        tabIndex={0}
      >
        {hasMoreHistory && (
          <button onClick={handleLoadMore} className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-lg">Load more</button>
        )}
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
                  tabIndex={0}
                  aria-label={message.sender === 'character' ? 'AI message' : 'User message'}
                  role="article"
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
                    {message.sender === 'character' && (
                      <div className="flex gap-2 mt-1">
                        <button aria-label="Thumbs up" onClick={() => handleFeedback(message.id, 'up')} className={`p-1 rounded-full ${feedback[message.id]==='up'?'bg-green-600 text-white':'bg-gray-700 text-gray-300'}`}>👍</button>
                        <button aria-label="Thumbs down" onClick={() => handleFeedback(message.id, 'down')} className={`p-1 rounded-full ${feedback[message.id]==='down'?'bg-red-600 text-white':'bg-gray-700 text-gray-300'}`}>👎</button>
                        <button aria-label="Flag as hallucination" onClick={() => handleFeedback(message.id, 'flag')} className={`p-1 rounded-full ${feedback[message.id]==='flag'?'bg-yellow-600 text-white':'bg-gray-700 text-gray-300'}`}>🚩</button>
                      </div>
                    )}
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
        {streamingMessage && (
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
              aria-label="Chat input"
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

      {/* Settings Modal */}
      {showSettings && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          className="settings-modal"
          tabIndex={-1}
          ref={settingsModalRef}
          onKeyDown={e => {
            if (e.key === 'Escape') closeSettings();
            // Trap focus inside modal
            if (e.key === 'Tab') {
              const focusable = settingsModalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
              if (focusable && focusable.length > 0) {
                const first = focusable[0] as HTMLElement;
                const last = focusable[focusable.length - 1] as HTMLElement;
                if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                } else if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                }
              }
            }
          }}
        >
          <h2 id="settings-modal-title">User Preferences</h2>
          {prefsError && <div className="error" role="alert">{prefsError}</div>}
          <form onSubmit={e => { e.preventDefault(); savePreferences(userPreferences); }}>
            <label htmlFor="chat-style-select">Chat Style:</label>
            <select
              id="chat-style-select"
              value={userPreferences?.chatStyle || ''}
              onChange={e => setUserPreferences((p: any) => ({ ...p, chatStyle: e.target.value }))}
              aria-label="Chat style"
            >
              <option value="">Select</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
            <label htmlFor="tts-voice-select">TTS Voice:</label>
            <select
              id="tts-voice-select"
              value={userPreferences?.ttsVoice || ''}
              onChange={e => setUserPreferences((p: any) => ({ ...p, ttsVoice: e.target.value }))}
              aria-label="TTS voice"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="predefined">Predefined</option>
            </select>
            <label htmlFor="theme-select">Theme:</label>
            <select
              id="theme-select"
              value={userPreferences?.theme || ''}
              onChange={e => setUserPreferences((p: any) => ({ ...p, theme: e.target.value }))}
              aria-label="Theme"
            >
              <option value="">Select</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <button type="submit" disabled={savingPrefs} aria-label="Save preferences">Save</button>
            <button type="button" onClick={closeSettings} disabled={savingPrefs} aria-label="Cancel and close preferences">Cancel</button>
          </form>
        </div>
      )}
    </div>
  )
}