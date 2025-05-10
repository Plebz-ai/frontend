// Determine WebSocket URL dynamically if possible
// For custom character chat, connect directly to AI_Layer2 (default: ws://localhost:5000/ws)
const getWebSocketUrl = () => {
  if (typeof window !== 'undefined') {
    // Allow override via env var
    if (process.env.NEXT_PUBLIC_WS_URL) {
      return process.env.NEXT_PUBLIC_WS_URL;
    }
    // Default to AI_Layer2 FastAPI server
    return 'ws://localhost:5000/ws';
  }
  // Fallback for non-browser environments or SSR
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
};

// Enhance getWebSocketUrl to accept characterId and clientId
export const getWebSocketUrlWithParams = (characterId?: string, clientId?: string) => {
  const base = getWebSocketUrl();
  const params = [];
  if (characterId) params.push(`characterId=${encodeURIComponent(characterId)}`);
  if (clientId) params.push(`clientId=${encodeURIComponent(clientId)}`);
  return params.length ? `${base}?${params.join('&')}` : base;
};

const WS_URL = getWebSocketUrl();

// Detect browser environment
const isBrowser = typeof window !== 'undefined';

export type MessageHandler = (data: WebSocketMessage) => void;
export type ConnectionHandler = () => void;
export type ErrorHandler = (error: any) => void;

export interface WebSocketMessage {
  type: string;
  content: any;
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
  RECONNECTING = 'reconnecting',
}

// Connection settings
const PING_INTERVAL = 30000; // 30 seconds
const PING_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000; // Base delay in ms
const MAX_RETRY_DELAY = 10000; // Max delay in ms

// WebSocket Connection Manager - singleton pattern
class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<ConnectionKey, ExtendedWebSocket> = new Map();
  private connectionStatus: Map<ConnectionKey, ConnectionStatus> = new Map();
  private messageHandlers: Map<ConnectionKey, Set<MessageHandler>> = new Map();
  private connectHandlers: Map<ConnectionKey, Set<ConnectionHandler>> = new Map();
  private disconnectHandlers: Map<ConnectionKey, Set<ConnectionHandler>> = new Map();
  private errorHandlers: Map<ConnectionKey, Set<ErrorHandler>> = new Map();
  private pingTimeouts: Map<ConnectionKey, NodeJS.Timeout> = new Map();
  private reconnectTimeouts: Map<ConnectionKey, NodeJS.Timeout> = new Map();
  private retryCounts: Map<ConnectionKey, number> = new Map();
  private lastConnectTime: Map<ConnectionKey, number> = new Map();

  private constructor() {
    console.log('WebSocket Manager initialized');
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private getConnectionKey(characterId: string, clientId: string): ConnectionKey {
    return `${characterId}:${clientId}`;
  }

  private clearTimeouts(key: ConnectionKey): void {
    const pingTimeout = this.pingTimeouts.get(key);
    if (pingTimeout) {
      clearTimeout(pingTimeout);
      this.pingTimeouts.delete(key);
    }

    const reconnectTimeout = this.reconnectTimeouts.get(key);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      this.reconnectTimeouts.delete(key);
    }
  }

  private heartbeat(key: ConnectionKey): void {
    const ws = this.connections.get(key);
    if (!ws) return;

    const existingTimeout = this.pingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'ping', content: { timestamp: Date.now() } }));
      } catch (e) {
        console.error('Error sending ping:', e);
      }
    }

    if (ws && ws.readyState !== WebSocket.CLOSING) {
      const timeout = setTimeout(() => {
        console.log(`Ping timeout for connection ${key} - closing connection`);
        this.closeConnection(key, 'Ping timeout');
      }, PING_TIMEOUT);

      this.pingTimeouts.set(key, timeout);
    }
  }

  private closeConnection(key: ConnectionKey, reason: string = 'Closing'): void {
    const ws = this.connections.get(key);
    if (!ws) return;

    try {
      if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        ws.close(1000, reason);
      }
    } catch (e) {
      console.error(`Error closing connection ${key}:`, e);
    }

    this.clearTimeouts(key);

    if (ws.pingInterval) {
      clearInterval(ws.pingInterval);
      ws.pingInterval = undefined;
    }

    this.connectionStatus.set(key, ConnectionStatus.DISCONNECTED);
    this.connections.delete(key);
    this.notifyDisconnect(key);
  }

  private notifyMessageHandlers(key: ConnectionKey, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(key);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${key}:`, error);
        }
      });
    }
  }

  private notifyConnect(key: ConnectionKey): void {
    const handlers = this.connectHandlers.get(key);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler();
        } catch (error) {
          console.error(`Error in connect handler for ${key}:`, error);
        }
      });
    }
  }

  private notifyDisconnect(key: ConnectionKey): void {
    const handlers = this.disconnectHandlers.get(key);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler();
        } catch (error) {
          console.error(`Error in disconnect handler for ${key}:`, error);
        }
      });
    }
  }

  private notifyError(key: ConnectionKey, error: any): void {
    const handlers = this.errorHandlers.get(key);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(error);
        } catch (err) {
          console.error(`Error in error handler for ${key}:`, err);
        }
      });
    }
  }

  private processMessage(key: ConnectionKey, messageStr: string): void {
    try {
      if (messageStr.trim() === '') {
        console.warn(`Empty message received from server for ${key}`);
        return;
      }

      if (messageStr === '#ping') {
        const ws = this.connections.get(key);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send('#pong');
        }
        return;
      }

      if (messageStr.startsWith('#') || messageStr.includes('ping') || messageStr.includes('pong')) {
        return;
      }

      const data = JSON.parse(messageStr) as WebSocketMessage;

      if (data.type === 'ping' || data.type === 'pong') {
        return;
      }

      this.notifyMessageHandlers(key, data);
    } catch (error) {
      console.error('Error processing WebSocket message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messagePreview: messageStr?.substring(0, 200) || 'Empty message',
        messageLength: messageStr?.length || 0,
        connectionKey: key,
        timestamp: new Date().toISOString(),
      });
    }
  }

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

    if (!force && currentStatus !== ConnectionStatus.DISCONNECTED && now - lastConnect < 300) {
      console.log(`Debouncing connection attempt for ${key} - last attempt was ${now - lastConnect}ms ago`);
      return false;
    }

    this.lastConnectTime.set(key, now);

    const existingConnection = this.connections.get(key);

    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      const existingSessionId = existingConnection.sessionId || undefined;

      if (existingSessionId === sessionId) {
        console.log(`Reusing existing open connection for ${key}`);
        return true;
      }

      if (sessionId) {
        console.log(`Updating session ID for existing connection ${key} from ${existingSessionId} to ${sessionId}`);
        existingConnection.sessionId = sessionId;

        setTimeout(() => {
          this.reconnectWithNewParams(key, characterId, clientId, sessionId);
        }, 100);

        return true;
      }
    }

    if (currentStatus === ConnectionStatus.CONNECTING || currentStatus === ConnectionStatus.RECONNECTING) {
      console.log(`Connection attempt already in progress for ${key}`);
      return false;
    }

    if (
      existingConnection &&
      (existingConnection.readyState === WebSocket.CLOSING || existingConnection.readyState === WebSocket.CLOSED)
    ) {
      console.log(`Cleaning up non-open connection for ${key}`);
      this.closeConnection(key, 'Replacing closed connection');
    }

    this.connectionStatus.set(key, ConnectionStatus.CONNECTING);

    setTimeout(() => {
      this.initiateConnection(key, characterId, clientId, sessionId);
    }, 50);

    return true;
  }

  private initiateConnection(key: ConnectionKey, characterId: string, clientId: string, sessionId?: string): void {
    try {
      let wsUrl = getWebSocketUrlWithParams(characterId, clientId);
      if (sessionId) {
        wsUrl += `&sessionId=${sessionId}`;
      }

      console.log(`Connecting to WebSocket for ${key} at: ${wsUrl}`);

      const ws = new WebSocket(wsUrl) as ExtendedWebSocket;
      ws.characterId = characterId;
      ws.clientId = clientId;
      ws.sessionId = sessionId;

      this.connections.set(key, ws);

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error(`Connection timeout for ${key}`);
          this.closeConnection(key, 'Connection timeout');
          this.attemptReconnect(key, characterId, clientId, sessionId);
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket connected successfully for ${key}`);
        this.retryCounts.set(key, 0);
        this.connectionStatus.set(key, ConnectionStatus.CONNECTED);

        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            this.heartbeat(key);
          } else {
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL);

        ws.pingInterval = pingInterval;
        this.heartbeat(key);
        this.notifyConnect(key);
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        const closeInfo = {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          readyState: this.getReadyStateString(ws.readyState),
          timestamp: new Date().toISOString(),
        };
        console.warn(`WebSocket connection closed for ${key}:`, closeInfo);
        this.clearTimeouts(key);
        this.attemptReconnect(key, characterId, clientId, sessionId);
      };

      ws.onerror = (event) => {
        console.error(`WebSocket error for ${key}:`, event);
        this.notifyError(key, event);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          this.heartbeat(key);
          this.processMessage(key, event.data);
        }
      };
    } catch (error) {
      console.error(`Error creating WebSocket connection for ${key}:`, error);
      this.connectionStatus.set(key, ConnectionStatus.DISCONNECTED);
      this.notifyDisconnect(key);
      this.attemptReconnect(key, characterId, clientId, sessionId);
    }
  }

  private attemptReconnect(key: ConnectionKey, characterId: string, clientId: string, sessionId?: string): void {
    if (this.shouldAttemptReconnect(key)) {
      const retryCount = (this.retryCounts.get(key) || 0) + 1;
      this.retryCounts.set(key, retryCount);

      const delay = Math.min(RETRY_DELAY_BASE * Math.pow(2, retryCount - 1), MAX_RETRY_DELAY);
      console.log(`Scheduling reconnect for ${key} in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`);

      this.connectionStatus.set(key, ConnectionStatus.RECONNECTING);

      setTimeout(() => {
        if (this.connectionStatus.get(key) === ConnectionStatus.RECONNECTING) {
          this.initiateConnection(key, characterId, clientId, sessionId);
        }
      }, delay);
    } else {
      console.log(`Max retries reached for ${key}. Connection will not be retried.`);
      this.connectionStatus.set(key, ConnectionStatus.DISCONNECTED);
      this.notifyDisconnect(key);
    }
  }

  private getReadyStateString(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING (0)';
      case WebSocket.OPEN:
        return 'OPEN (1)';
      case WebSocket.CLOSING:
        return 'CLOSING (2)';
      case WebSocket.CLOSED:
        return 'CLOSED (3)';
      default:
        return `UNKNOWN (${readyState})`;
    }
  }

  private shouldAttemptReconnect(key: ConnectionKey): boolean {
    const retryCount = this.retryCounts.get(key) || 0;
    return retryCount < MAX_RETRIES;
  }

  private reconnectWithNewParams(key: ConnectionKey, characterId: string, clientId: string, sessionId?: string): void {
    console.log(`Reconnecting ${key} with new parameters`);

    this.closeConnection(key, 'Updating parameters');

    setTimeout(() => {
      this.initiateConnection(key, characterId, clientId, sessionId);
    }, 100);
  }

  public disconnect(characterId: string, clientId: string): void {
    const key = this.getConnectionKey(characterId, clientId);
    console.log(`Explicitly disconnecting ${key}`);
    this.closeConnection(key, 'User disconnected');
  }

  public addMessageHandler(characterId: string, clientId: string, handler: MessageHandler): void {
    const key = this.getConnectionKey(characterId, clientId);

    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, new Set());
    }

    this.messageHandlers.get(key)?.add(handler);
  }

  public removeMessageHandler(characterId: string, clientId: string, handler: MessageHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.messageHandlers.get(key)?.delete(handler);
  }

  public addConnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);

    if (!this.connectHandlers.has(key)) {
      this.connectHandlers.set(key, new Set());
    }

    this.connectHandlers.get(key)?.add(handler);
  }

  public removeConnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.connectHandlers.get(key)?.delete(handler);
  }

  public addDisconnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);

    if (!this.disconnectHandlers.has(key)) {
      this.disconnectHandlers.set(key, new Set());
    }

    this.disconnectHandlers.get(key)?.add(handler);
  }

  public removeDisconnectHandler(characterId: string, clientId: string, handler: ConnectionHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.disconnectHandlers.get(key)?.delete(handler);
  }

  public addErrorHandler(characterId: string, clientId: string, handler: ErrorHandler): void {
    const key = this.getConnectionKey(characterId, clientId);

    if (!this.errorHandlers.has(key)) {
      this.errorHandlers.set(key, new Set());
    }

    this.errorHandlers.get(key)?.add(handler);
  }

  public removeErrorHandler(characterId: string, clientId: string, handler: ErrorHandler): void {
    const key = this.getConnectionKey(characterId, clientId);
    this.errorHandlers.get(key)?.delete(handler);
  }

  public sendAudioData(characterId: string, clientId: string, audioData: Uint8Array | number[]): boolean {
    const content = Array.isArray(audioData) ? audioData : Array.from(audioData);
    return this.sendMessage(characterId, clientId, 'audio', { data: content });
  }

  public isConnected(characterId: string, clientId: string): boolean {
    const key = this.getConnectionKey(characterId, clientId);
    const ws = this.connections.get(key);
    return ws !== undefined && ws.readyState === WebSocket.OPEN;
  }

  public getConnectionStatus(characterId: string, clientId: string): ConnectionStatus {
    const key = this.getConnectionKey(characterId, clientId);
    return this.connectionStatus.get(key) || ConnectionStatus.DISCONNECTED;
  }

  public static async testConnection(url: string = WS_URL): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      try {
        const testWs = new WebSocket(url);
        const timeout = setTimeout(() => {
          testWs.close();
          resolve({
            success: false,
            message: 'Connection attempt timed out',
          });
        }, 5000);

        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close(1000, 'Test successful');
          resolve({
            success: true,
            message: 'Successfully connected to WebSocket server',
          });
        };

        testWs.onerror = () => {
          clearTimeout(timeout);
          resolve({
            success: false,
            message: 'Failed to connect to WebSocket server',
          });
        };
      } catch (error) {
        resolve({
          success: false,
          message: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    });
  }
}

// Create a client API that interfaces with the WebSocket manager
export function createWebSocketClient(
  onMessage: MessageHandler,
  onConnect: ConnectionHandler,
  onDisconnect: ConnectionHandler,
  onError?: ErrorHandler
) {
  const manager = WebSocketManager.getInstance();

  let activeCharacterId: string | null = null;
  let activeClientId: string | null = null;

  const connect = (characterId: string, clientId: string, sessionId?: string) => {
    console.log(
      `WebSocket client connecting: characterId=${characterId}, clientId=${clientId}, sessionId=${sessionId ? 'provided' : 'none'}`
    );

    activeCharacterId = characterId;
    activeClientId = clientId;

    manager.addMessageHandler(characterId, clientId, onMessage);
    manager.addConnectHandler(characterId, clientId, onConnect);
    manager.addDisconnectHandler(characterId, clientId, onDisconnect);
    if (onError) {
      manager.addErrorHandler(characterId, clientId, onError);
    }

    return manager.connect(characterId, clientId, sessionId);
  };

  const disconnect = () => {
    if (activeCharacterId && activeClientId) {
      console.log(`WebSocket client disconnecting: characterId=${activeCharacterId}, clientId=${activeClientId}`);

      manager.removeMessageHandler(activeCharacterId, activeClientId, onMessage);
      manager.removeConnectHandler(activeCharacterId, activeClientId, onConnect);
      manager.removeDisconnectHandler(activeCharacterId, activeClientId, onDisconnect);
      if (onError) {
        manager.removeErrorHandler(activeCharacterId, activeClientId, onError);
      }

      manager.disconnect(activeCharacterId, activeClientId);

      activeCharacterId = null;
      activeClientId = null;
    }
  };

  // Send a message of any type with any payload. For custom characters, include is_custom and character_config in content.
  const sendMessage = (type: string, content: any): boolean => {
    if (!activeCharacterId || !activeClientId) {
      console.error('Cannot send message - no active connection');
      return false;
    }

    return manager.sendMessage(activeCharacterId, activeClientId, type, content);
  };

  const sendAudioData = (audioData: Uint8Array | number[]): boolean => {
    if (!activeCharacterId || !activeClientId) {
      console.error('Cannot send audio data - no active connection');
      return false;
    }

    return manager.sendAudioData(activeCharacterId, activeClientId, audioData);
  };

  const isConnected = (): boolean => {
    if (!activeCharacterId || !activeClientId) {
      return false;
    }

    return manager.isConnected(activeCharacterId, activeClientId);
  };

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    return WebSocketManager.testConnection();
  };

  return {
    connect,
    disconnect,
    sendMessage,
    sendAudioData,
    isConnected,
    testConnection,
  };
}