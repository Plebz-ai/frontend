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
}

export default function ChatWindow({ characterId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
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
        setError(event.reason || 'Connection closed. Click "Reconnect" to try again.')
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
          setMessages((prev) => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            ...message,
            timestamp: new Date()
          }])
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
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <div className="mt-4 text-gray-600">Connecting to chat...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Chat</div>
            <div className={`text-sm ${connected ? 'text-green-500' : 'text-red-500'}`}>
              {connected ? 'Connected' : error || 'Disconnected'}
            </div>
          </div>
          {!connected && (
            <button
              onClick={connectWebSocket}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="break-words">{message.content}</div>
                <div className="text-xs mt-1 opacity-75">
                  {format(typeof message.timestamp === 'number' ? new Date(message.timestamp) : message.timestamp, 'HH:mm:ss')}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-4">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={!connected}
            placeholder={connected ? 'Type your message...' : (error || 'Connecting...')}
            className="w-full p-3 pl-4 pr-10 bg-transparent text-gray-900 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none min-h-[48px] max-h-[120px] placeholder-gray-500"
            rows={1}
          />
          <button
            type="submit"
            disabled={!connected || !inputMessage.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </form>
      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
    </div>
  )
} 