// --- Unified WebSocket Client for Character.AI Platform ---
// Supports both Go backend and AI_Layer2 FastAPI, with dynamic path and protocol switching.

// --- ENVIRONMENT CONFIG ---
// Set NEXT_PUBLIC_WS_TARGET to 'backend' or 'ai' in your .env file to control the default target.
// - 'backend': ws://localhost:8080/ws (Go backend, for video/voice, predefined characters)
// - 'ai':      ws://localhost:5000/ws (AI_Layer2, for custom character chat)
// If not set, defaults to 'backend'.

const WS_TARGET = process.env.NEXT_PUBLIC_WS_TARGET || 'backend';
const WS_URLS = {
  backend: process.env.NEXT_PUBLIC_WS_BACKEND_URL || 'ws://localhost:8081/ws',
  ai: process.env.NEXT_PUBLIC_WS_AI_URL || 'ws://localhost:5000/ws',
};

// API URLs for direct HTTP calls (use Next.js proxy route '/ai-layer')
const API_URLS = {
  ai: process.env.NEXT_PUBLIC_AI_LAYER_URL || '/ai-layer'
};

// Helper: Determine if a character is custom
export function isCustomCharacter(character: any): boolean {
  return !!character && (character.is_custom === true || (typeof character.id === 'string' && character.id.startsWith('custom-')));
}

// Helper: Build the correct WebSocket URL for a given character and client
export function getWebSocketUrlForCharacter(character: any, clientId: string, sessionId?: string): string {
  if (isCustomCharacter(character)) {
    // AI_Layer2 expects /ws/{client_id}
    return `${WS_URLS.ai}/${clientId}`;
  }
  // Backend expects /ws?characterId=...&clientId=...&sessionId=...
  const params = [
    `characterId=${encodeURIComponent(character.id)}`,
    `clientId=${encodeURIComponent(clientId)}`,
    sessionId ? `sessionId=${encodeURIComponent(sessionId)}` : null,
  ].filter(Boolean).join('&');
  return `${WS_URLS.backend}?${params}`;
}

// --- WebSocket Client API ---
export type MessageHandler = (data: any) => void;
export type ConnectionHandler = () => void;
export type ErrorHandler = (error: any) => void;

// --- Unified WebSocket Client Factory ---
export function createWebSocketClient(
  character: any,
  clientId: string,
  sessionId: string,
  onMessage: MessageHandler,
  onConnect: ConnectionHandler,
  onDisconnect: ConnectionHandler,
  onError?: ErrorHandler
) {
  const isCustom = isCustomCharacter(character);
  if (isCustom) {
    // Patch: Use HTTP POST to orchestrator instead of WebSocket
    let connected = false;
    function sendMessage(type: string, content: any) {
      if (!connected) return;
      // For chat, content is the message object
      const body: any = {
        user_input: content.content,
        character_details: character,
        mode: 'chat',
      };
      if (content.audio_data) {
        body.audio_data = content.audio_data;
      }
      console.log('[AI-Layer2 DEBUG] Outgoing payload to orchestrator:', JSON.stringify(body, null, 2));
      
      // Use Next.js proxy for AI Layer2: '/ai-layer/interact' => orchestrator
      const apiUrl = `${API_URLS.ai.replace(/\/$/, '')}/interact`;
      console.log('[AI-Layer2 DEBUG] Using API URL:', apiUrl);
      
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(res => {
          console.log(`[AI-Layer2 DEBUG] Response status: ${res.status}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[AI-Layer2 DEBUG] Response from orchestrator:', data);
          onMessage({ 
            type: 'text_response', 
            content: data.response,
            error: data.error
          });
        })
        .catch(err => {
          console.error('[AI-Layer2 ERROR]', err);
          onMessage({
            type: 'text_response',
            content: `Connection error: ${err.message}. Please try again.`,
            error: { connection: err.message }
          });
          if (onError) onError(err);
        });
    }
    function connect() { connected = true; onConnect(); }
    function disconnect() { connected = false; onDisconnect(); }
    setTimeout(connect, 0);
    return { sendMessage, disconnect };
  }
  const url = getWebSocketUrlForCharacter(character, clientId, sessionId);
  let ws: WebSocket | null = null;
  let connected = false;
  let pingInterval: any = null;

  function connect() {
    ws = new WebSocket(url);
    ws.onopen = () => {
      connected = true;
      console.log(`[WebSocket] OPEN: ${url}`);
      // Immediately send a ping/hello message to keep the connection alive
      if (isCustom) {
        sendMessage('ping', { clientId, sessionId });
      } else {
        sendMessage('ping', {});
      }
      // Start periodic ping
      pingInterval = setInterval(() => {
        if (isCustom) {
          sendMessage('ping', { clientId, sessionId });
        } else {
          sendMessage('ping', {});
        }
      }, 25000); // 25s
      onConnect();
    };
    ws.onclose = (event) => {
      connected = false;
      if (pingInterval) clearInterval(pingInterval);
      console.log(`[WebSocket] CLOSE: ${url} code=${event.code} reason=${event.reason}`);
      onDisconnect();
    };
    ws.onerror = (event) => {
      console.error(`[WebSocket] ERROR: ${url}`, event);
      onError?.(event);
    };
    ws.onmessage = (event) => {
      console.log(`[WebSocket] MESSAGE: ${url} data=`, event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          // Optionally log pong
          console.log('[WebSocket] PONG received');
          return;
        }
        onMessage(data);
      } catch (e) {
        onError?.(e);
      }
    };
  }

  connect();

  function sendMessage(type: string, content: any) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open');
      return false;
    }
    let msg;
    if (isCustom) {
      msg = { type, ...content };
    } else {
      msg = { type, content };
    }
    ws.send(JSON.stringify(msg));
    return true;
  }

  function disconnect() {
    if (pingInterval) clearInterval(pingInterval);
    if (ws) ws.close();
  }

  function isConnected() {
    return !!ws && ws.readyState === WebSocket.OPEN;
  }

  return {
    sendMessage,
    disconnect,
    isConnected,
  };
}

// --- END ---