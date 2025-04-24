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
  const PING_INTERVAL = 300000 // Increased to 300000 (5 minutes)
  const PING_TIMEOUT = 60000 // Increased to 60000 (1 minute)
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

    // Only set the ping timeout if ws exists and is not closing
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

  const connect = (characterId: string, clientId: string, sessionId?: string) => {
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

      // Build the WebSocket URL, including sessionId if provided
      let wsUrl = `${WS_URL}?characterId=${characterId}&clientId=${clientId}`
      if (sessionId) {
        wsUrl += `&sessionId=${sessionId}`
      }
      console.log('Connecting to WebSocket:', wsUrl)
      
      // Add a small delay before connecting to ensure server is ready
      setTimeout(() => {
        try {
          ws = new WebSocket(wsUrl)
          console.log('WebSocket instance created, waiting for connection...')
        } catch (wsError) {
          console.error('Error creating WebSocket instance:', wsError)
          onDisconnect()
          return
        }

        // Store a local reference to ws that TypeScript knows is non-null
        const socket = ws;
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (socket && socket.readyState === WebSocket.CONNECTING) {
            console.error('Connection timeout - closing connection')
            socket.close(1000, 'Connection timeout')
          }
        }, 10000) // Increased from 5000 to 10000 (10 seconds)

        // Only proceed with listeners if ws was successfully created
        socket.onopen = () => {
          clearTimeout(connectionTimeout)
          console.log('WebSocket connected successfully')
          retryCount = 0
          
          // Start sending pings at regular intervals
          const pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              heartbeat();
            } else {
              clearInterval(pingInterval);
            }
          }, PING_INTERVAL);
          
          // Store the interval so it can be cleared on close
          socket.pingInterval = pingInterval;
          
          heartbeat(); // Start monitoring connection
          onConnect()
        }

        socket.onclose = (event) => {
          clearTimeout(connectionTimeout)
          console.log('WebSocket connection closed:', event.code, event.reason)
          clearTimeouts()
          
          // Clear the ping interval if it exists
          if (socket.pingInterval) {
            clearInterval(socket.pingInterval);
            socket.pingInterval = undefined;
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

        socket.onerror = (event) => {
          const errorInfo = {
            message: 'WebSocket connection error occurred',
            type: event.type,
            url: wsUrl,
            readyState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState],
            time: new Date().toISOString(),
            target: event.target ? 'WebSocket' : 'unknown',
          };
          
          console.error('WebSocket error detected:', errorInfo);
          
          // The onclose handler will handle reconnection
          // Force close if in CONNECTING state to trigger onclose
          if (socket.readyState === WebSocket.CONNECTING) {
            try {
              socket.close(1000, 'Error during connection');
            } catch (e) {
              console.error('Error closing socket after error:', e);
            }
          }
        }

        socket.onmessage = (event) => {
          try {
            // Handle ping/pong messages without JSON parsing
            if (typeof event.data === 'string') {
              // Reset heartbeat on any message
              heartbeat();
              
              if (event.data === '#ping') {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send('#pong')
                }
                return
              }
              
              // Check if message contains newlines (server might send multiple JSON objects)
              if (event.data.includes('\n')) {
                console.log('Received multiple messages in one WebSocket frame');
                // Split by newline and process each message
                const messages = event.data.split('\n').filter(msg => msg.trim() !== '');
                
                for (const msgStr of messages) {
                  try {
                    // Process each message individually
                    processMessage(msgStr);
                  } catch (err) {
                    console.error('Error processing individual message in batch:', err);
                  }
                }
                return;
              }
              
              // Process single message
              processMessage(event.data);
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
              dataPreview: typeof event.data === 'string' ? event.data.substring(0, 100) : 'Not a string',
              timestamp: new Date().toISOString()
            })
          }
        }
        
        // Helper function to process a single message
        function processMessage(messageStr: string) {
          try {
            // Log the raw message for debugging
            if (messageStr.trim() === '') {
              console.warn('Empty message received from server');
              return;
            }
            
            // Check for ping/pong messages first to avoid parsing
            if (messageStr.includes('"type":"ping"') || messageStr.includes('"type":"pong"')) {
              // Don't log these messages to reduce noise
              const data = JSON.parse(messageStr) as WebSocketMessage;
              // Still call onMessage with ping/pong messages
              if (data.type === 'ping' || data.type === 'pong') {
                return; // Don't pass ping/pong messages to the handler
              }
              return;
            }
            
            // Log the message for debugging (only non-ping/pong messages)
            console.debug('Processing WebSocket message:', messageStr.substring(0, 500));
            
            const data = JSON.parse(messageStr) as WebSocketMessage
            
            // Handle call state messages
            if (data.type === 'call_state') {
              console.log('Call state update:', data.content)
            }
            
            onMessage(data)
          } catch (jsonError) {
            // Enhanced error handling for JSON parsing errors
            const messagePreview = messageStr?.substring(0, 200) || 'Empty message';
            console.error('Error parsing WebSocket message as JSON:', {
              error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error',
              messagePreview: messagePreview,
              messageLength: messageStr?.length || 0,
              timestamp: new Date().toISOString()
            });
            
            // Try to handle potential special message formats
            if (messageStr.startsWith('#') || messageStr.includes('ping') || messageStr.includes('pong')) {
              console.log('Received possible control message, ignoring JSON parsing error');
              return;
            }
          }
        }
      }, 100); // Add a 100ms delay before connecting
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
      
      // Only log non-ping messages to reduce console noise
      if (type !== 'ping' && type !== 'pong') {
        console.debug(`Sending message: ${type}`)
      }
      
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