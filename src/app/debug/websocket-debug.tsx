'use client';
import React, { useState, useRef } from 'react';
import { isCustomCharacter, getWebSocketUrlForCharacter } from '../../lib/websocket';

export default function WebSocketDebug() {
  const [target, setTarget] = useState<'backend' | 'ai'>('backend');
  const [characterId, setCharacterId] = useState('1');
  const [clientId, setClientId] = useState(() => Math.random().toString(36).substring(7));
  const [sessionId, setSessionId] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState<string[]>([]);
  const [rawMessage, setRawMessage] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const character = { id: characterId, is_custom: isCustom };

  function appendLog(msg: string) {
    setLog(l => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  function connect() {
    if (wsRef.current) wsRef.current.close();
    setLog([]);
    setStatus('connecting');
    const url = getWebSocketUrlForCharacter(character, clientId, sessionId);
    appendLog(`Connecting to: ${url}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => {
      setStatus('open');
      appendLog('WebSocket OPEN');
    };
    ws.onclose = (e) => {
      setStatus('closed');
      appendLog(`WebSocket CLOSE (code=${e.code}, reason=${e.reason})`);
    };
    ws.onerror = (e) => {
      setStatus('error');
      appendLog('WebSocket ERROR: ' + (e instanceof Event ? 'Event' : JSON.stringify(e)));
    };
    ws.onmessage = (e) => {
      appendLog('WebSocket MESSAGE: ' + e.data);
    };
  }

  function disconnect() {
    if (wsRef.current) wsRef.current.close();
    setStatus('closed');
    appendLog('WebSocket manually closed');
  }

  function sendRaw() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      appendLog('Cannot send: WebSocket not open');
      return;
    }
    try {
      wsRef.current.send(rawMessage);
      appendLog('Sent: ' + rawMessage);
    } catch (e) {
      appendLog('Send error: ' + e);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Debugger</h1>
      <div className="mb-4 flex flex-col gap-2">
        <label>
          Target:
          <select value={target} onChange={e => {
            setTarget(e.target.value as 'backend' | 'ai');
            setIsCustom(e.target.value === 'ai');
          }} className="ml-2 border rounded p-1">
            <option value="backend">Go Backend</option>
            <option value="ai">AI_Layer2</option>
          </select>
        </label>
        <label>
          Character ID:
          <input value={characterId} onChange={e => setCharacterId(e.target.value)} className="ml-2 border rounded p-1" />
        </label>
        <label>
          Client ID:
          <input value={clientId} onChange={e => setClientId(e.target.value)} className="ml-2 border rounded p-1" />
        </label>
        <label>
          Session ID:
          <input value={sessionId} onChange={e => setSessionId(e.target.value)} className="ml-2 border rounded p-1" />
        </label>
        <label>
          Custom Character:
          <input type="checkbox" checked={isCustom} onChange={e => setIsCustom(e.target.checked)} className="ml-2" />
        </label>
        <div className="flex gap-2 mt-2">
          <button onClick={connect} className="bg-green-600 text-white px-4 py-2 rounded">Connect</button>
          <button onClick={disconnect} className="bg-red-600 text-white px-4 py-2 rounded">Disconnect</button>
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Send Raw JSON Message:</label>
        <textarea value={rawMessage} onChange={e => setRawMessage(e.target.value)} rows={3} className="w-full border rounded p-2 font-mono" placeholder='{"type": "text_message", ...}' />
        <button onClick={sendRaw} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Log:</label>
        <div className="bg-gray-900 text-green-200 p-2 rounded h-64 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
      <div>Status: <span className="font-bold">{status}</span></div>
    </div>
  );
} 