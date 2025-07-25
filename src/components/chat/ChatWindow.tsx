'use client'

import React, { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { getWebSocketUrl, getWebSocketUrlWithParams } from '../../lib/websocket'

interface Message {
  id: string
  type: string
  content: string
  timestamp: Date
}

interface ChatWindowProps {
  characterId: string
  character?: any // Add character prop for better context
}

export default function ChatWindow({ characterId, character }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const clientIdRef = useRef<string>('')

  // Initialize clientId once when component mounts
  useEffect(() => {
    if (!clientIdRef.current) {
      clientIdRef.current = Math.random().toString(36).substring(7)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const connectWebSocket = () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('Connection already in progress or established')
      return
    }

    try {
      setIsConnecting(true)
      
      if (wsRef.current) {
        console.log('Closing existing connection')
        wsRef.current.close()
      }

      // Ensure we have a valid clientId
      if (!clientIdRef.current) {
        clientIdRef.current = Math.random().toString(36).substring(7)
      }

      const wsUrl = getWebSocketUrlWithParams(characterId, clientIdRef.current)
      console.log('Connecting to WebSocket:', wsUrl)
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        setConnected(true)
        setError(null)
        setIsLoading(false)
        setIsConnecting(false)
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })
        setConnected(false)
        setIsLoading(false)
        setIsConnecting(false)
        setError(event.reason || 'Time bridge disconnected. Click "Reconnect" to continue your conversation.')
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError(error instanceof Event ? 'Connection error. Click "Reconnect" to try again.' : String(error))
        setConnected(false)
        setIsLoading(false)
        setIsConnecting(false)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Handle typing indicators
          if (message.type === 'typing_start') {
            setIsTyping(true)
            return
          }
          if (message.type === 'typing_stop') {
            setIsTyping(false)
            return
          }
          
          setMessages((prev) => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            ...message,
            timestamp: new Date()
          }])
          setIsTyping(false)
        } catch (err) {
          console.error('Error parsing message:', err)
          setError('Failed to process message')
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Failed to connect. Click "Reconnect" to try again.')
      setIsLoading(false)
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    // Load previous messages from localStorage
    const savedMessages = localStorage.getItem(`chat-messages-${characterId}`)
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (err) {
        console.error('Error loading saved messages:', err)
      }
    }

    // Only connect if we have a valid clientId
    if (clientIdRef.current) {
      connectWebSocket()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [characterId])

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`chat-messages-${characterId}`, JSON.stringify(messages))
  }, [messages, characterId])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wsRef.current || !inputMessage.trim() || !connected) return

    try {
      const message = {
        type: 'chat',
        content: {
          id: `${Date.now()}-${Math.random()}`,
          sender: 'user',
          content: inputMessage.trim(),
          timestamp: Date.now()
        }
      }

      wsRef.current.send(JSON.stringify(message))
      // Optimistically add the message to the UI
      setMessages((prev) => [...prev, {
        ...message.content,
        type: 'user',
        // id, sender, content, timestamp already set
      }])
      setInputMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl items-center justify-center border border-gray-700/50">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping"></div>
        </div>
        <div className="mt-4 text-gray-300 font-medium">Opening Time Bridge...</div>
        <div className="text-gray-500 text-sm">Connecting to {character?.name || 'your companion'}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Time Bridge Chat</div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <div className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Connected Across Time' : error || 'Bridge Disconnected'}
                </div>
              </div>
            </div>
          </div>
          {!connected && (
            <button
              onClick={connectWebSocket}
              disabled={isConnecting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors duration-200"
            >
              {isConnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
          )}
        </div>
        {character && (
          <div className="mt-2 text-gray-400 text-sm">
            Chatting with <span className="text-indigo-400 font-medium">{character.name}</span>
            {character.tagline && <span className="ml-2">• {character.tagline}</span>}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && connected && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Begin Your Conversation</h3>
            <p className="text-gray-400 text-sm">Start chatting with {character?.name || 'your companion'} across time</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-gray-700/50 text-gray-100 border border-gray-600/50'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-indigo-200' : 'text-gray-400'
              }`}>
                {format(message.timestamp, 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700/50 text-gray-100 border border-gray-600/50 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message across time..."
            disabled={!connected}
            className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!connected || !inputMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  )
} 