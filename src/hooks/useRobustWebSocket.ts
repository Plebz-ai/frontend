import { useEffect, useRef, useCallback } from 'react';

export interface UseRobustWebSocketOptions {
  url: string;
  onOpen?: (ev: Event) => void;
  onMessage?: (ev: MessageEvent) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
  protocols?: string | string[];
  maxAttempts?: number;
  reconnectableCodes?: number[];
}

export function useRobustWebSocket({
  url,
  onOpen,
  onMessage,
  onClose,
  onError,
  protocols,
  maxAttempts = 7,
  reconnectableCodes = [1000, 1001, 1005, 1006],
}: UseRobustWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const closedByUser = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }
    closedByUser.current = false;
    const ws = new WebSocket(url, protocols);
    wsRef.current = ws;

    ws.onopen = (ev) => {
      reconnectAttempts.current = 0;
      if (onOpen) onOpen(ev);
    };
    ws.onmessage = (ev) => {
      if (onMessage) onMessage(ev);
    };
    ws.onerror = (ev) => {
      if (onError) onError(ev);
    };
    ws.onclose = (ev) => {
      if (onClose) onClose(ev);
      if (!closedByUser.current && reconnectableCodes.includes(ev.code)) {
        if (reconnectAttempts.current < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 20000);
          const jitter = Math.random() * 0.3 * delay;
          reconnectAttempts.current += 1;
          reconnectTimeout.current = setTimeout(connect, delay + jitter);
        }
      }
    };
  }, [url, protocols, onOpen, onMessage, onClose, onError, maxAttempts, reconnectableCodes]);

  useEffect(() => {
    connect();
    return () => {
      closedByUser.current = true;
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);

  const send = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  const close = useCallback(() => {
    closedByUser.current = true;
    if (wsRef.current) wsRef.current.close();
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
  }, []);

  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return { send, close, isConnected, ws: wsRef.current };
} 