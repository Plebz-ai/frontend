'use client'

import React, { useEffect, useRef, useState } from 'react';

// --- Types ---
interface VideoCallProps {
  character: any;
  onClose: () => void;
  sessionId?: string;
  initialMessages?: any[];
  videoDisabled?: boolean;
  userPreferences?: any; // Optionally pass user preferences
}

// --- Main Component ---
export default function VideoCall({ character, onClose, sessionId, initialMessages, videoDisabled, userPreferences }: VideoCallProps) {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready to Connect');
  const [showMicPrompt, setShowMicPrompt] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>(userPreferences?.ttsVoice || 'predefined');
  const [isStarting, setIsStarting] = useState(false);

  // Audio pipeline refs
  const ttsAudioChunks = useRef<Uint8Array[]>([]);
  const ttsMimeTypeRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);
  
  // --- Start Call Handler ---
  const handleStartCall = () => {
    if (isCallStarted || isStarting || (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1))) {
      console.warn('[VideoCall] Start call ignored: already started or connecting');
      return; // Prevent double start
    }
    setIsStarting(true);
    setShowMicPrompt(false);
    setIsCallStarted(true);
    setStatus('Opening Time Bridge...');
    console.log('[VideoCall] Opening WebSocket connection...');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8010/ws/video-session`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    let initSent = false;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('Connected Across Time');
      if (!initSent) {
        ws.send(JSON.stringify({ type: 'init', character_details: { ...character, ttsVoice: selectedVoice } }));
        initSent = true;
        console.log('[VideoCall] INIT message sent');
      } else {
        console.warn('[VideoCall] INIT message already sent, skipping');
      }
      setIsStarting(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('Connection Lost');
      setIsStarting(false);
    };

    ws.onerror = (e) => {
      setWsError('Connection failed');
      setStatus('Connection Error');
      setIsStarting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'tts_mime_type') {
          ttsMimeTypeRef.current = data.mime_type;
        } else if (data.type === 'tts_chunk') {
          try {
            const bytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
            ttsAudioChunks.current.push(bytes);
          } catch (err) {
            setTtsError('Failed to decode audio chunk');
          }
        } else if (data.type === 'tts_end') {
          if (ttsAudioChunks.current.length === 0) {
            setTtsError('No audio received');
            return;
          }
          const totalLength = ttsAudioChunks.current.reduce((acc, b) => acc + b.length, 0);
          const merged = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of ttsAudioChunks.current) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }
          ttsAudioChunks.current = [];

          if (audioRef.current) {
            audioRef.current.pause();
            if (lastAudioUrlRef.current && audioRef.current.src.startsWith('blob:')) {
              URL.revokeObjectURL(audioRef.current.src);
            }
          }

          const blob = new Blob([merged], { type: ttsMimeTypeRef.current || 'audio/wav' });
          const url = URL.createObjectURL(blob);
          lastAudioUrlRef.current = url;

          audioRef.current = new Audio(url);
          audioRef.current.onended = () => {
            URL.revokeObjectURL(url);
            setIsTTSPlaying(false);
          };
          audioRef.current.onerror = (e) => {
            setTtsError('Playback failed');
            setIsTTSPlaying(false);
            URL.revokeObjectURL(url);
          };
          setIsTTSPlaying(true);
          audioRef.current.play().catch(err => {
            setTtsError('Playback failed');
            setIsTTSPlaying(false);
            URL.revokeObjectURL(url);
          });
        } else if (data.type === 'greeting') {
          setStatus('Conversation Active');
        } else if (data.type === 'error') {
          setTtsError(data.error || 'Connection error');
        }
      } catch (err) {
        setTtsError('Malformed message from backend');
      }
    };
  };

  // --- End Call Handler ---
  const handleEndCall = () => {
    setIsCallStarted(false);
    setIsConnected(false);
    setStatus('Ready to Connect');
    setShowMicPrompt(true);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      if (lastAudioUrlRef.current) {
        URL.revokeObjectURL(lastAudioUrlRef.current);
      }
    }
    ttsAudioChunks.current = [];
    ttsMimeTypeRef.current = null;
    setTtsError(null);
    setWsError(null);
    setIsTTSPlaying(false);
    onClose();
  };

  // --- Cleanup on Unmount ---
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (audioRef.current) {
        audioRef.current.pause();
        if (lastAudioUrlRef.current) {
          URL.revokeObjectURL(lastAudioUrlRef.current);
        }
      }
    };
    // eslint-disable-next-line
  }, []);

  // --- UI ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900/20 to-purple-900/20 text-white">
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700/50">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Aletheia</h1>
              <p className="text-sm text-gray-400">Time Bridge Connection</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Connecting with {character?.name}</h2>
            <p className="text-gray-400 text-sm">{character?.description}</p>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="space-y-4">
          {/* Status Display */}
          <div className="flex items-center justify-center p-4 bg-gray-700/50 rounded-lg">
            <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium">{status}</span>
          </div>

          {/* Error Messages */}
          {ttsError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {ttsError}
            </div>
          )}
          {wsError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              {wsError}
            </div>
          )}

          {/* Call Controls */}
        {showMicPrompt && (
            <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleStartCall}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 text-lg font-semibold flex items-center gap-3 shadow-lg hover:shadow-indigo-500/30"
                aria-label="Start Time Bridge Connection"
              disabled={isCallStarted || isStarting}
            >
                <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v1.5m0 0a6.75 6.75 0 01-6.75-6.75v-3A6.75 6.75 0 0112 3.75a6.75 6.75 0 016.75 6.75v3a6.75 6.75 0 01-6.75 6.75zm0 0v-1.5" />
              </svg>
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                </div>
                <span>Open Time Bridge</span>
            </button>
              
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Ready to connect across time</p>
                <p className="text-gray-500 text-xs">Click to begin your conversation with {character?.name}</p>
              </div>
          </div>
        )}

          {/* Active Call Controls */}
        {isCallStarted && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full ${isTTSPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'} mb-2`}></div>
                  <span className="text-xs text-gray-400">Audio</span>
                </div>
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'} mb-2`}></div>
                  <span className="text-xs text-gray-400">Connection</span>
                </div>
              </div>
              
            <button
              onClick={handleEndCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors duration-200 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                End Connection
            </button>
          </div>
        )}

          {/* Voice Selection */}
        {!isCallStarted && (
            <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
              <label className="block text-sm font-medium text-gray-300 mb-2">Voice Selection</label>
            <select
              value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="predefined">Auto-select (Recommended)</option>
                <option value="male">Male Voice</option>
                <option value="female">Female Voice</option>
            </select>
            </div>
          )}
        </div>

        {/* Debug Audio Controls */}
        {lastAudioUrlRef.current && (
          <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Debug Audio:</p>
            <audio controls src={lastAudioUrlRef.current} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
} 