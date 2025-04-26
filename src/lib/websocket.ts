const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081/ws'

export type MessageHandler = (data: WebSocketMessage) => void
export type ConnectionHandler = () => void

export interface WebSocketMessage {
  type: string
  content: any
}

// Extend WebSocket type to include custom properties
interface ExtendedWebSocket extends WebSocket {
  pingInterval?: NodeJS.Timeout;
  characterId?: string;
  clientId?: string;
  sessionId?: string;
}

// Keys for connection identification
type ConnectionKey = string;

// Connection status
enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

// WebSocket Connection Manager - singleton pattern
class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<ConnectionKey, ExtendedWebSocket> = new Map();
  private connectionStatus: Map<ConnectionKey, ConnectionStatus> = new Map();
  private messageHandlers: Map<ConnectionKey, Set<MessageHandler>> = new Map();
  private connectHandlers: Map<ConnectionKey, Set<ConnectionHandler>> = new Map();
  private disconnectHandlers: Map<ConnectionKey, Set<ConnectionHandler>> = new Map();
  private pingTimeouts: Map<ConnectionKey, NodeJS.Timeout> = new Map();
  private reconnectTimeouts: Map<ConnectionKey, NodeJS.Timeout> = new Map();
  private retryCounts: Map<ConnectionKey, number> = new Map();
  private lastConnectTime: Map<ConnectionKey, number> = new Map();
  
  // Connection settings
  private readonly PING_INTERVAL = 300000; // 5 minutes
  private readonly PING_TIMEOUT = 60000; // 1 minute
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_BASE = 1000; // Base delay in ms
  private readonly MAX_RETRY_DELAY = 10000; // Max delay in ms
  private readonly CONNECT_DEBOUNCE = 300; // Debounce connect calls by 300ms
  private readonly SESSION_UPDATE_DEBOUNCE = 100; // Debounce session updates

  private constructor() {
    // Private constructor for singleton pattern
    console.log('WebSocket Manager initialized');
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Generate a consistent key for a connection
  private getConnectionKey(characterId: string, clientId: string): ConnectionKey {
    return `${characterId}:${clientId}`;
  }

  // Clear all timeouts for a connection
  private clearTimeouts(key: ConnectionKey): void {
    // Clear ping timeout
    const pingTimeout = this.pingTimeouts.get(key);
    if (pingTimeout) {
      clearTimeout(pingTimeout);
      this.pingTimeouts.delete(key);
    }

    // Clear reconnect timeout
    const reconnectTimeout = this.reconnectTimeouts.get(key);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      this.reconnectTimeouts.delete(key);
    }
  }

  // Heartbeat function to keep connection alive
  private heartbeat(key: ConnectionKey): void {
    const ws = this.connections.get(key);
    if (!ws) return;

    // Clear existing timeout if any
    const existingTimeout = this.pingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Send ping to server if connection is open
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "ping", content: null }));
      } catch (e) {
        console.error("Error sending ping:", e);
      }
    }

    // Set new timeout only if connection exists and is not closing
    if (ws && ws.readyState !== WebSocket.CLOSING) {
      const timeout = setTimeout(() => {
        console.log(`Ping timeout for connection ${key} - closing connection`);
        this.closeConnection(key, 'Ping timeout');
      }, this.PING_TIMEOUT);
      
      this.pingTimeouts.set(key, timeout);
    }
  }

  // Close and clean up a connection
  private closeConnection(key: ConnectionKey, reason: string = 'Closing'): void {
    const ws = this.connections.get(key);
    if (!ws) return;

    // Close WebSocket connection
    try {
      if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        ws.close(1000, reason);
      }
    } catch (e) {
      console.error(`Error closing connection ${key}:`, e);
    }

    // Clean up resources
    this.clearTimeouts(key);
    
    // Clear ping interval if it exists
    if (ws.pingInterval) {
      clearInterval(ws.pingInterval);
      ws.pingInterval = undefined;
    }

    // Update status
    this.connectionStatus.set(key, ConnectionStatus.DISCONNECTED);
    
    // Remove from connections map
    this.connections.delete(key);
    
    // Notify disconnection handlers
    this.notifyDisconnect(key);
  }

  // Notify all message handlers for a connection
  private notifyMessageHandlers(key: ConnectionKey, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(key);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${key}:`, error);
        }
      });
    }
  }

  // Notify all connection handlers
  private notifyConnect(key: ConnectionKey): void {
    const handlers = this.connectHandlers.get(key);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          console.error(`Error in connect handler for ${key}:`, error);
        }
      });
    }
  }

  // Notify all disconnection handlers
  private notifyDisconnect(key: ConnectionKey): void {
    const handlers = this.disconnectHandlers.get(key);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          console.error(`Error in disconnect handler for ${key}:`, error);
        }
      });
    }
  }

  // Process a received WebSocket message
  private processMessage(key: ConnectionKey, messageStr: string): void {
    try {
      // Skip empty messages
      if (messageStr.trim() === '') {
        console.warn(`Empty message received from server for ${key}`);
        return;
      }
      
      // Handle ping/pong messages without JSON parsing
      if (messageStr === '#ping') {
        const ws = this.connections.get(key);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send('#pong');
        }
        return;
      }
      
      // Handle special message formats
      if (messageStr.startsWith('#') || messageStr.includes('ping') || messageStr.includes('pong')) {
        // Simple control messages, no further processing needed
        return;
      }
      
      // Parse message as JSON
      const data = JSON.parse(messageStr) as WebSocketMessage;
      
      // Skip ping/pong messages from bubbling up
      if (data.type === 'ping' || data.type === 'pong') {
        return;
      }
      
      // Notify message handlers
      this.notifyMessageHandlers(key, data);
    } catch (error) {
      // Enhanced error handling for JSON parsing errors
      console.error('Error processing WebSocket message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messagePreview: messageStr?.substring(0, 200) || 'Empty message',
        messageLength: messageStr?.length || 0,
        connectionKey: key,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Connect to WebSocket server
  public connect(characterId: string, clientId: string, sessionId?: string, force: boolean = false): boolean {
    if (!characterId || !clientId) {
      console.error('Invalid connection parameters: characterId and clientId are required');
      return false;
    }

    if (!WS_URL) {
      console.error('Invalid connection: WebSocket URL is not configured');
      return false;
    }

    const key = this.getConnectionKey(characterId, clientId);
    const currentStatus = this.connectionStatus.get(key) || ConnectionStatus.DISCONNECTED;
    const lastConnect = this.lastConnectTime.get(key) || 0;
    const now = Date.now();
    
    // Check if we should debounce this connection attempt
    if (!force && currentStatus !== ConnectionStatus.DISCONNECTED && now - lastConnect < this.CONNECT_DEBOUNCE) {
      console.log(`Debouncing connection attempt for ${key} - last attempt was ${now - lastConnect}ms ago`);
      return false;
    }
    
    // Update last connect time
    this.lastConnectTime.set(key, now);

    // Check for existing connection
    const existingConnection = this.connections.get(key);
    
    // If connection exists and is open, and sessionId matches or is not provided, reuse it
    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      const existingSessionId = existingConnection.sessionId || undefined;
      
      // If sessionId is the same or both are undefined, connection is already what we need
      if (existingSessionId === sessionId) {
        console.log(`Reusing existing open connection for ${key}`);
        return true;
      }
      
      // If we have a new session ID, update existing connection's session ID
      if (sessionId) {
        console.log(`Updating session ID for existing connection ${key} from ${existingSessionId} to ${sessionId}`);
        existingConnection.sessionId = sessionId;
        
        // We should reconnect with new session ID parameters
        setTimeout(() => {
          this.reconnectWithNewParams(key, characterId, clientId, sessionId);
        }, this.SESSION_UPDATE_DEBOUNCE);
        
        return true;
      }
    }
    
    // If we're already connecting or reconnecting, don't start another connection
    if (currentStatus === ConnectionStatus.CONNECTING || currentStatus === ConnectionStatus.RECONNECTING) {
      console.log(`Connection attempt already in progress for ${key}`);
      return false;
    }
    
    // If we have an existing connection that's not open or closing, close it
    if (existingConnection && 
        (existingConnection.readyState === WebSocket.CLOSING || 
         existingConnection.readyState === WebSocket.CLOSED)) {
      console.log(`Cleaning up non-open connection for ${key}`);
      this.closeConnection(key, 'Replacing closed connection');
    }
    
    // Update connection status
    this.connectionStatus.set(key, ConnectionStatus.CONNECTING);
    
    // Start the actual connection process
    setTimeout(() => {
      this.initiateConnection(key, characterId, clientId, sessionId);
    }, 50); // Slight delay to allow UI to update
    
    return true;
  }

  // Initiate the actual WebSocket connection
  private initiateConnection(key: ConnectionKey, characterId: string, clientId: string, sessionId?: string): void {
    try {
      // Build WebSocket URL
      let wsUrl = `${WS_URL}?characterId=${characterId}&clientId=${clientId}`;
      if (sessionId) {
        wsUrl += `&sessionId=${sessionId}`;
      }
      
      console.log(`Connecting to WebSocket for ${key} at: ${wsUrl}`);
      
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl) as ExtendedWebSocket;
      
      // Store character, client, and session IDs
      ws.characterId = characterId;
      ws.clientId = clientId;
      ws.sessionId = sessionId;
      
      // Store the connection
      this.connections.set(key, ws);
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error(`Connection timeout for ${key} - closing connection`);
          this.closeConnection(key, 'Connection timeout');
        }
      }, 10000); // 10 second connection timeout
      
      // WebSocket event handlers
      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket connected successfully for ${key}`);
        
        // Reset retry count
        this.retryCounts.set(key, 0);
        
        // Update connection status
        this.connectionStatus.set(key, ConnectionStatus.CONNECTED);
        
        // Start heartbeat mechanism
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            this.heartbeat(key);
          } else {
            clearInterval(pingInterval);
          }
        }, this.PING_INTERVAL);
        
        // Store interval for cleanup
        ws.pingInterval = pingInterval;
        
        // Initial heartbeat
        this.heartbeat(key);
        
        // Notify connection handlers
        this.notifyConnect(key);
      };
      
      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket connection closed for ${key}:`, event.code, event.reason);
        
        // Clear all timeouts
        this.clearTimeouts(key);
        
        // Clear ping interval if it exists
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
          ws.pingInterval = undefined;
        }
        
        // Attempt to reconnect with exponential backoff
        if (this.shouldAttemptReconnect(key)) {
          const retryCount = (this.retryCounts.get(key) || 0) + 1;
          this.retryCounts.set(key, retryCount);
          
          const delay = Math.min(this.RETRY_DELAY_BASE * Math.pow(2, retryCount), this.MAX_RETRY_DELAY);
          console.log(`Scheduling reconnect for ${key} in ${delay}ms (attempt ${retryCount}/${this.MAX_RETRIES})`);
          
          // Update status
          this.connectionStatus.set(key, ConnectionStatus.RECONNECTING);
          
          // Schedule reconnection
          const timeout = setTimeout(() => {
            // Only reconnect if still in RECONNECTING state
            if (this.connectionStatus.get(key) === ConnectionStatus.RECONNECTING) {
              console.log(`Attempting reconnection for ${key}`);
              this.initiateConnection(key, characterId, clientId, sessionId);
            }
          }, delay);
          
          this.reconnectTimeouts.set(key, timeout);
        } else {
          // No more reconnection attempts
          console.log(`No more reconnection attempts for ${key}`);
          this.connectionStatus.set(key, ConnectionStatus.DISCONNECTED);
        }
        
        // Remove from connections map
        this.connections.delete(key);
        
        // Notify disconnection handlers
        this.notifyDisconnect(key);
      };
      
      ws.onerror = (event) => {
        console.error(`WebSocket error for ${key}:`, {
          readyState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
          time: new Date().toISOString()
        });
        
        // onclose will handle reconnection
      };
      
      ws.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            // Reset heartbeat on any message
            this.heartbeat(key);
            
            // Check if message contains newlines (multiple JSON objects)
            if (event.data.includes('\n')) {
              // Split by newline and process each message
              const messages = event.data.split('\n').filter(msg => msg.trim() !== '');
              
              messages.forEach(msg => this.processMessage(key, msg));
            } else {
              // Process single message
              this.processMessage(key, event.data);
            }
          } else {
            console.warn(`Non-string WebSocket message received for ${key}:`, {
              type: typeof event.data,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error handling WebSocket message for ${key}:`, error);
        }
      };
    } catch (error) {
      console.error(`Error creating WebSocket connection for ${key}:`, error);
      
      // Update status
      this.connectionStatus.set(key, ConnectionStatus.DISCONNECTED);
      
      // Notify disconnection handlers
      this.notifyDisconnect(key);
    }
  }

  // Check if reconnection should be attempted
  private shouldAttemptReconnect(key: ConnectionKey): boolean {
    const retryCount = this.retryCounts.get(key) || 0;
    return retryCount < this.MAX_RETRIES;
  }

  // Reconnect with new parameters (primarily for session ID changes)
  private reconnectWithNewParams(key: ConnectionKey, characterId: string, clientId: string, sessionId?: string): void {
    console.log(`Reconnecting ${key} with new parameters`);
    
    // Close existing connection
    this.closeConnection(key, 'Updating parameters');
    
    // Initiate new connection with minimal delay
    setTimeout(() => {
      this.initiateConnection(key, characterId, clientId, sessionId);
    }, 100);
  }

  // Disconnect a specific connection
  public disconnect(characterId: string, clientId: string): void {
    const key = this.getConnectionKey(characterId, clientId);
    console.log(`Explicitly disconnecting ${key}`);
    this.closeConnection(key, 'User disconnected');
  }

  // Register message handler
  public addMessageHandler(characterId: string, clientId: string, handler: MessageHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    
    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, new Set());
    }
    
    this.messageHandlers.get(key)?.add(handler);
  }

  // Unregister message handler
  public removeMessageHandler(characterId: string, clientId: string, handler: MessageHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.messageHandlers.get(key)?.delete(handler);
  }

  // Register connect handler
  public addConnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    
    if (!this.connectHandlers.has(key)) {
      this.connectHandlers.set(key, new Set());
    }
    
    this.connectHandlers.get(key)?.add(handler);
  }

  // Unregister connect handler
  public removeConnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.connectHandlers.get(key)?.delete(handler);
  }

  // Register disconnect handler
  public addDisconnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    
    if (!this.disconnectHandlers.has(key)) {
      this.disconnectHandlers.set(key, new Set());
    }
    
    this.disconnectHandlers.get(key)?.add(handler);
  }

  // Unregister disconnect handler
  public removeDisconnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.disconnectHandlers.get(key)?.delete(handler);
  }

  // Send a message over a specific connection
  public sendMessage(characterId: string, clientId: string, type: string, content: any): boolean {
    const key = this.getConnectionKey(characterId, clientId);
    const ws = this.connections.get(key);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error(`Cannot send message - WebSocket is not open for ${key}`);
      return false;
    }
    
    try {
      const message: WebSocketMessage = { type, content };
      
      // Only log non-ping messages to reduce console noise
      if (type !== 'ping' && type !== 'pong') {
        console.debug(`Sending message type ${type} for ${key}`);
      }
      
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending message for ${key}:`, error);
      return false;
    }
  }

  // Send audio data over a specific connection
  public sendAudioData(characterId: string, clientId: string, audioData: Uint8Array | number[]): boolean {
    const content = Array.isArray(audioData) ? audioData : Array.from(audioData);
    return this.sendMessage(characterId, clientId, 'audio', { data: content });
  }

  // Check if a connection is currently open
  public isConnected(characterId: string, clientId: string): boolean {
    const key = this.getConnectionKey(characterId, clientId);
    const ws = this.connections.get(key);
    return ws !== undefined && ws.readyState === WebSocket.OPEN;
  }

  // Get connection status
  public getConnectionStatus(characterId: string, clientId: string): ConnectionStatus {
    const key = this.getConnectionKey(characterId, clientId);
    return this.connectionStatus.get(key) || ConnectionStatus.DISCONNECTED;
  }
}

// Create a client API that interfaces with the WebSocket manager
export function createWebSocketClient(
  onMessage: MessageHandler,
  onConnect: ConnectionHandler,
  onDisconnect: ConnectionHandler
) {
  // Get WebSocket manager instance
  const manager = WebSocketManager.getInstance();
  
  // Client ID for this client instance
  let activeCharacterId: string | null = null;
  let activeClientId: string | null = null;
  
  // Register handlers when connect is called
  const connect = (characterId: string, clientId: string, sessionId?: string) => {
    console.log(`WebSocket client connecting: characterId=${characterId}, clientId=${clientId}, sessionId=${sessionId}`);
    
    // Store IDs for this client instance
    activeCharacterId = characterId;
    activeClientId = clientId;
    
    // Register handlers
    manager.addMessageHandler(characterId, clientId, onMessage);
    manager.addConnectHandler(characterId, clientId, onConnect);
    manager.addDisconnectHandler(characterId, clientId, onDisconnect);
    
    // Connect (or reuse existing connection)
    return manager.connect(characterId, clientId, sessionId);
  };
  
  // Clean up handlers when disconnect is called
  const disconnect = () => {
    if (activeCharacterId && activeClientId) {
      console.log(`WebSocket client disconnecting: characterId=${activeCharacterId}, clientId=${activeClientId}`);
      
      // Remove handlers
      manager.removeMessageHandler(activeCharacterId, activeClientId, onMessage);
      manager.removeConnectHandler(activeCharacterId, activeClientId, onConnect);
      manager.removeDisconnectHandler(activeCharacterId, activeClientId, onDisconnect);
      
      // Disconnect
      manager.disconnect(activeCharacterId, activeClientId);
      
      // Clear active IDs
      activeCharacterId = null;
      activeClientId = null;
    }
  };
  
  // Send a message
  const sendMessage = (type: string, content: any): boolean => {
    if (!activeCharacterId || !activeClientId) {
      console.error('Cannot send message - no active connection');
      return false;
    }
    
    return manager.sendMessage(activeCharacterId, activeClientId, type, content);
  };
  
  // Send audio data
  const sendAudioData = (audioData: Uint8Array | number[]): boolean => {
    if (!activeCharacterId || !activeClientId) {
      console.error('Cannot send audio data - no active connection');
      return false;
    }
    
    return manager.sendAudioData(activeCharacterId, activeClientId, audioData);
  };
  
  // Check if connected
  const isConnected = (): boolean => {
    if (!activeCharacterId || !activeClientId) {
      return false;
    }
    
    return manager.isConnected(activeCharacterId, activeClientId);
  };
  
  // Return client API
  return {
    connect,
    disconnect,
    sendMessage,
    sendAudioData,
    isConnected
  };
} 