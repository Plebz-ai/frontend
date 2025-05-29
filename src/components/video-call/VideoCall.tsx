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
  const [status, setStatus] = useState<string>('Idle');
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
    setStatus('Connecting...');
    console.log('[VideoCall] Opening WebSocket connection...');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8010/ws/video-session`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    let initSent = false;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('Connected');
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
      setStatus('Disconnected');
      setIsStarting(false);
    };

    ws.onerror = (e) => {
      setWsError('WebSocket error');
      setStatus('Error');
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
          setStatus('Call started');
        } else if (data.type === 'error') {
          setTtsError(data.error || 'TTS error');
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
    setStatus('Idle');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-4">Voice/Video Call</h2>
        <div className="mb-2">Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{status}</span></div>
        {ttsError && <div className="text-red-500 mb-2">{ttsError}</div>}
        {wsError && <div className="text-red-500 mb-2">{wsError}</div>}
        {showMicPrompt && (
          <div className="flex flex-col items-center mb-4">
            <button
              onClick={handleStartCall}
              className="px-6 py-3 bg-green-600 rounded-full hover:bg-green-700 transition text-lg flex items-center gap-2 shadow-lg"
              aria-label="Start Voice Call"
              disabled={isCallStarted || isStarting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v1.5m0 0a6.75 6.75 0 01-6.75-6.75v-3A6.75 6.75 0 0112 3.75a6.75 6.75 0 016.75 6.75v3a6.75 6.75 0 01-6.75 6.75zm0 0v-1.5" />
              </svg>
              <span>Start Call</span>
            </button>
            <div className="mt-2 text-gray-400 text-sm">Click the mic to start the call</div>
          </div>
        )}
        {isCallStarted && (
          <div className="flex flex-col items-center mb-4">
            <button
              onClick={handleEndCall}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
            >
              End Call
            </button>
            <div className="mt-4 font-mono text-sm">TTS Playing: {isTTSPlaying ? 'Yes' : 'No'}</div>
            {/* Fallback audio controls for debugging */}
            {lastAudioUrlRef.current && (
              <audio controls src={lastAudioUrlRef.current} className="w-full mt-2" />
            )}
          </div>
        )}
        {!isCallStarted && (
          <div className="video-call-setup">
            <label htmlFor="tts-voice-select">TTS Voice:</label>
            <select
              id="tts-voice-select"
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              aria-label="TTS voice for call"
            >
              <option value="predefined">Predefined</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
} 