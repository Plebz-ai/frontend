const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081/ws'

export type MessageHandler = (data: WebSocketMessage) => void
export type ConnectionHandler = () => void

export interface WebSocketMessage {
  type: string
  content: any
}

export function createWebSocketClient(
  onMessage: MessageHandler,
  onConnect: ConnectionHandler,
  onDisconnect: ConnectionHandler
) {
  // Extend WebSocket type to include custom properties
  interface ExtendedWebSocket extends WebSocket {
    pingInterval?: NodeJS.Timeout;
  }
  
  let ws: ExtendedWebSocket | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  let pingTimeout: NodeJS.Timeout | null = null
  const MAX_RETRIES = 5
  let retryCount = 0
  const PING_INTERVAL = 25000 // 25 seconds
  const PING_TIMEOUT = 30000 // Increased from 5000 to 30000 (30 seconds)
  let isExplicitlyDisconnected = false

  const clearTimeouts = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (pingTimeout) {
      clearTimeout(pingTimeout)
      pingTimeout = null
    }
  }

  const heartbeat = () => {
    if (pingTimeout) clearTimeout(pingTimeout)

    // Send ping to server
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "ping", content: null }));
      } catch (e) {
        console.error("Error sending ping:", e);
      }
    }

    if (ws && ws.readyState !== WebSocket.CLOSING) {
      pingTimeout = setTimeout(() => {
        console.log('Ping timeout - closing connection')
        if (ws) {
          ws.close(1000, 'Ping timeout')
        }
      }, PING_TIMEOUT)
    }
  }

  const validateConnection = (characterId: string, clientId: string): boolean => {
    if (!characterId) {
      console.error('Invalid connection: characterId is required')
      return false
    }

    if (!clientId) {
      console.error('Invalid connection: clientId is required')
      return false
    }

    if (!WS_URL) {
      console.error('Invalid connection: WebSocket URL is not configured')
      return false
    }

    return true
  }

  const connect = (characterId: string, clientId: string) => {
    try {
      if (!validateConnection(characterId, clientId)) {
        onDisconnect()
        return
      }

      if (ws) {
        console.log('Closing existing connection')
        ws.close(1000, 'Reconnecting')
      }

      clearTimeouts()
      isExplicitlyDisconnected = false

      const wsUrl = `${WS_URL}?characterId=${characterId}&clientId=${clientId}`
      console.log('Connecting to WebSocket:', wsUrl)
      
      try {
        ws = new WebSocket(wsUrl)
        console.log('WebSocket instance created, waiting for connection...')
      } catch (wsError) {
        console.error('Error creating WebSocket instance:', wsError)
        onDisconnect()
        return
      }

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CONNECTING) {
          console.error('Connection timeout - closing connection')
          ws.close(1000, 'Connection timeout')
        }
      }, 5000) // 5 second connection timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log('WebSocket connected successfully')
        retryCount = 0
        
        // Start sending pings at regular intervals
        const pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            heartbeat();
          } else {
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL);
        
        // Store the interval so it can be cleared on close
        ws.pingInterval = pingInterval;
        
        heartbeat(); // Start monitoring connection
        onConnect()
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log('WebSocket connection closed:', event.code, event.reason)
        clearTimeouts()
        
        // Clear the ping interval if it exists
        if (ws && ws.pingInterval) {
          clearInterval(ws.pingInterval);
          ws.pingInterval = undefined;
        }

        if (!isExplicitlyDisconnected && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`)
          reconnectTimeout = setTimeout(() => connect(characterId, clientId), delay)
        } else {
          console.log('No more reconnection attempts')
        }

        onDisconnect()
      }

      ws.onerror = (event) => {
        const errorInfo = {
          message: 'WebSocket connection error occurred',
          type: event.type,
          url: wsUrl,
          readyState: ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState] : 'null',
          time: new Date().toISOString(),
          target: event.target ? 'WebSocket' : 'unknown',
        };
        
        console.error('WebSocket error detected:', errorInfo);
        
        // The onclose handler will handle reconnection
        // Force close if in CONNECTING state to trigger onclose
        if (ws && ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close(1000, 'Error during connection');
          } catch (e) {
            console.error('Error closing socket after error:', e);
          }
        }
      }

      ws.onmessage = (event) => {
        try {
          // Handle ping/pong messages without JSON parsing
          if (typeof event.data === 'string') {
            // Reset heartbeat on any message
            heartbeat();
            
            if (event.data === '#ping') {
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send('#pong')
              }
              return
            }
            
            try {
              // Only try to parse as JSON if it's not a ping message
              const data = JSON.parse(event.data) as WebSocketMessage
              
              // Handle pong messages from server
              if (data.type === 'pong') {
                return;
              }
              
              // Handle call state messages
              if (data.type === 'call_state') {
                console.log('Call state update:', data.content)
              }
              
              onMessage(data)
            } catch (jsonError) {
              console.error('Error parsing WebSocket message as JSON:', {
                error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error',
                data: event.data.substring(0, 100),
                timestamp: new Date().toISOString()
              })
            }
          } else {
            console.warn('Non-string WebSocket message received:', {
              type: typeof event.data,
              timestamp: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dataType: typeof event.data,
            timestamp: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        wsUrl: WS_URL,
        characterId,
        clientId,
        timestamp: new Date().toISOString()
      })
      
      if (retryCount < MAX_RETRIES) {
        retryCount++
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        console.log(`Retrying connection in ${delay}ms... (attempt ${retryCount}/${MAX_RETRIES})`)
        reconnectTimeout = setTimeout(() => connect(characterId, clientId), delay)
      }
    }
  }

  const sendMessage = (type: string, content: any) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message - WebSocket is not open')
      return false
    }

    try {
      const message: WebSocketMessage = { type, content }
      ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  const sendAudioData = (audioData: Uint8Array | number[]) => {
    // Ensure audioData is in the right format for sending
    const content = Array.isArray(audioData) ? audioData : Array.from(audioData)
    return sendMessage('audio', { data: content })
  }

  const disconnect = () => {
    isExplicitlyDisconnected = true
    clearTimeouts()
    
    if (ws) {
      ws.close(1000, 'User disconnected')
      ws = null
    }
  }

  return {
    connect,
    disconnect,
    sendMessage,
    sendAudioData,
    isConnected: () => ws !== null && ws.readyState === WebSocket.OPEN
  }
} 