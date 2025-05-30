'use client'

import React, { useEffect, useRef, useState } from 'react';
import VAD from 'voice-activity-detection';
import axios from 'axios';
import { useWakeWord } from '../../hooks/useWakeWord';

// Remove the inline type definitions since we now have them in the declaration file
interface VoiceCallProps {
  character: any;
  onClose: () => void;
  userPreferences?: any; // Optionally pass user preferences
}

export default function VoiceCall({ character, onClose, userPreferences }: VoiceCallProps) {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Idle');
  const [showMicPrompt, setShowMicPrompt] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(userPreferences?.ttsVoice || 'predefined');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [llm2StreamingText, setLlm2StreamingText] = useState<string>("");
  const [llm2FinalText, setLlm2FinalText] = useState<string>("");
  const [history, setHistory] = useState<{role: string, text: string}[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'pitch' | 'qna'>('idle');
  const [isPitchTTSLoading, setIsPitchTTSLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(character?.system_prompt || "");
  const [greetingScript, setGreetingScript] = useState<string>(character?.greeting_script || "");
  const [vadEnabled, setVadEnabled] = useState<boolean>(true);

  // Audio pipeline refs
  const ttsAudioChunks = useRef<Uint8Array[]>([]);
  const ttsMimeTypeRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const prevSpeakingRef = useRef<boolean>(false);

  const initSentRef = useRef(false);
  const audioStreamingStartedRef = useRef(false);

  const pitchAudioRef = useRef<HTMLAudioElement | null>(null);

  // Wake word detection
  const {
    isReady: isWakeWordReady,
    isListening: isWakeWordListening,
    error: wakeWordError,
    start: startWakeWord,
    stop: stopWakeWord,
  } = useWakeWord({
    accessKey: 'spQfPKZkZaqo7WmnOc5B9qCSNbjIiX8RdnOUKleYH8q/nLMrN8obcQ==',
    onWakeWord: () => {
      setMode('pitch');
      setStatus('Sia detected! Pitch starting...');
    },
    label: 'Sia',
    autoStart: true,
  });

  // Add this ref and constant at the top of the component (inside VoiceCall)
  const speechStartTimeRef = useRef<number | null>(null);
  const MIN_UTTERANCE_DURATION = 1.0; // seconds

  const handleStartCall = async () => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8010/ws/voice-session`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'init',
        characterDetails: {
          ...character,
          ttsVoice: selectedVoice,
          system_prompt: systemPrompt,
          greeting_script: greetingScript,
          vad_enabled: vadEnabled,
        }
      }));
      initSentRef.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'tts_mime_type') {
          ttsMimeTypeRef.current = data.mime_type;
          console.log('[VoiceCall][TTS] Received MIME type:', data.mime_type);
        } else if (data.type === 'tts_chunk') {
          try {
            const bytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
            ttsAudioChunks.current.push(bytes);
            console.log('[VoiceCall][TTS] Received tts_chunk, decoded size:', bytes.length);
          } catch (err) {
            setTtsError('Failed to decode audio chunk');
            console.error('[VoiceCall][TTS] Failed to decode tts_chunk:', err);
          }
        } else if (data.type === 'tts_end') {
          if (ttsAudioChunks.current.length === 0) {
            setTtsError('No audio received');
            console.error('[VoiceCall][TTS] No audio received at tts_end');
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
          console.log('[VoiceCall][TTS] Starting playback, total audio size:', merged.length, 'MIME:', ttsMimeTypeRef.current || 'audio/wav');
          audioRef.current.onended = () => {
            URL.revokeObjectURL(url);
            setIsTTSPlaying(false);
            console.log('[VoiceCall][TTS] Playback ended');
            // Only start audio streaming after greeting playback is fully finished
            if (!audioStreamingStartedRef.current) {
              startAudioStreaming();
              console.log('[VoiceCall] Audio streaming started after greeting playback ended');
            }
          };
          audioRef.current.onerror = (e) => {
            setTtsError('Playback failed');
            setIsTTSPlaying(false);
            URL.revokeObjectURL(url);
            console.error('[VoiceCall][TTS] Playback failed', e);
          };
          setIsTTSPlaying(true);
          audioRef.current.play().then(() => {
            console.log('[VoiceCall][TTS] Playback started, duration:', audioRef.current?.duration);
          }).catch(err => {
            setTtsError('Playback failed');
            setIsTTSPlaying(false);
            URL.revokeObjectURL(url);
            console.error('[VoiceCall][TTS] Playback failed (promise)', err);
          });
        } else if (data.type === 'greeting') {
          setStatus('Call started');
        } else if (data.type === 'error') {
          setTtsError(data.error || 'TTS error');
          console.error('[VoiceCall][TTS] Error:', data.error);
        } else if (data.type === 'llm2_partial') {
          setLlm2StreamingText(data.text || "");
        } else if (data.type === 'llm2_final') {
          setLlm2FinalText(data.text || "");
          setLlm2StreamingText("");
          setHistory(prev => [...prev, { role: 'assistant', text: data.text || "" }]);
        } else if (data.type === 'transcript_final') {
          setHistory(prev => [...prev, { role: 'user', text: data.text || "" }]);
        }
      } catch (err) {
        setTtsError('Malformed message from backend');
        console.error('[VoiceCall][TTS] Malformed message from backend:', err);
      }
    };

    ws.onerror = (e) => {
      setWsError('WebSocket error');
      setStatus('Error');
      stopAudioStreaming();
      setIsTTSPlaying(false);
      console.error('[VoiceCall][WS] WebSocket error:', e);
    };
    ws.onclose = () => {
      setIsConnected(false);
      setStatus('Disconnected');
      stopAudioStreaming();
      setIsTTSPlaying(false);
      console.log('[VoiceCall][WS] WebSocket closed');
    };
  };

  // Only allow VAD/audio streaming in Q&A mode
  useEffect(() => {
    if (mode !== 'qna') {
      stopAudioStreaming();
    }
  }, [mode]);

  // --- Audio Streaming Logic ---
  const startAudioStreaming = async () => {
    if (audioStreamingStartedRef.current) {
      console.warn('[VoiceCall] Audio streaming already started, skipping');
      return;
    }
    audioStreamingStartedRef.current = true;
    try {
      setMicError(null);
      
      // --- Browser Detection ---
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      const isChrome = navigator.userAgent.toLowerCase().includes('chrome');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      console.log('[VoiceCall] Browser detection:', { 
        isSafari, isFirefox, isChrome, isMobile, 
        userAgent: navigator.userAgent 
      });
      
      // --- Permissions API check ---
      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (perm.state === 'denied') {
            setMicError('Microphone access is denied in your browser settings. Please allow mic access (click the lock icon in the address bar).');
            setIsMicActive(false);
            setShowMicPrompt(true);
            return;
          }
        } catch (permErr) {
          // Permissions API not supported or failed, continue
          console.warn('[VoiceCall] Permissions API error:', permErr);
        }
      }
      
      // --- getUserMedia ---
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            channelCount: 1, 
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
      } catch (err: any) {
        console.error('[VoiceCall] getUserMedia error:', err);
        if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setMicError('Microphone access was denied. Please allow mic access in your browser (click the lock icon in the address bar).');
        } else if (err && err.name === 'NotFoundError') {
          setMicError('No microphone was found on your device. Please connect a mic and try again.');
        } else {
          setMicError('Microphone access denied or unavailable. ' + (err && err.message ? `Reason: ${err.message}` : ''));
        }
        setIsMicActive(false);
        setShowMicPrompt(true);
        return;
      }
      
      console.log('[VoiceCall] getUserMedia returned:', stream);
      console.log('[VoiceCall] MediaStream details:', { 
        active: stream.active,
        id: stream.id,
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      
      if (!stream.active || !stream.getAudioTracks().length) {
        setMicError('No active audio tracks found in MediaStream. Please check your mic and browser settings.');
        setIsMicActive(false);
        setShowMicPrompt(true);
        return;
      }
      
      mediaStreamRef.current = stream;
      setIsMicActive(true);

      // --- DIRECT AUDIO PROCESSING IMPLEMENTATION ---
      // This bypasses the problematic VAD library completely
      
      // Simple volume detection threshold
      const VOLUME_THRESHOLD = 0.01;
      let isSpeechDetected = false;
      let silenceTimeout: NodeJS.Timeout | null = null;
      
      // Create audio analyzer
      try {
        // Create a separate audio context just for analysis
        const analyzerContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzerSource = analyzerContext.createMediaStreamSource(stream);
        const analyzerNode = analyzerContext.createAnalyser();
        analyzerNode.fftSize = 256;
        analyzerSource.connect(analyzerNode);
        
        const dataArray = new Uint8Array(analyzerNode.frequencyBinCount);
        
        // Store cleanup function
        const cleanup = () => {
          if (silenceTimeout) clearTimeout(silenceTimeout);
          try {
            analyzerSource.disconnect();
            analyzerContext.close().catch(err => {
              console.error('[VoiceCall] Error closing analyzer context:', err);
            });
          } catch (err) {
            console.error('[VoiceCall] Error in analyzer cleanup:', err);
          }
        };
        
        // Store for later cleanup
        if (audioContextRef.current) {
          (audioContextRef.current as any).__vadCleanup = cleanup;
        }
        
        // Use analyzer to detect speech
        const detectSpeech = () => {
          if (!initSentRef.current) return;
          
          analyzerNode.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length / 255; // Normalize to 0-1
          
          // Detect speech start
          if (average > VOLUME_THRESHOLD && !isSpeechDetected) {
            isSpeechDetected = true;
            setIsSpeaking(true);
            speechStartTimeRef.current = Date.now();
            console.log('[VoiceCall][SimpleVAD] Speech started, volume:', average.toFixed(3));
            
            // Handle barge-in
            if (isTTSPlaying && audioRef.current) {
              audioRef.current.pause();
              setIsTTSPlaying(false);
              if (wsRef.current && wsRef.current.readyState === 1) {
                wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
                console.log('[VoiceCall][SimpleVAD] Sent barge_in marker');
              }
            }
            
            // Clear any pending silence timeout
            if (silenceTimeout) {
              clearTimeout(silenceTimeout);
              silenceTimeout = null;
            }
          } 
          // Detect silence after speech
          else if (average <= VOLUME_THRESHOLD && isSpeechDetected) {
            // Only trigger end after sustained silence (500ms)
            if (!silenceTimeout) {
              silenceTimeout = setTimeout(() => {
                isSpeechDetected = false;
                setIsSpeaking(false);
                const speechEndTime = Date.now();
                const durationSec = speechStartTimeRef.current
                  ? (speechEndTime - speechStartTimeRef.current) / 1000
                  : 0;
                speechStartTimeRef.current = null;
                if (durationSec >= MIN_UTTERANCE_DURATION) {
                  // Only send if long enough
                  if (wsRef.current && wsRef.current.readyState === 1) {
                    wsRef.current.send(JSON.stringify({ type: 'end_of_utterance' }));
                    console.log(`[VoiceCall][SimpleVAD] Sent end_of_utterance marker (duration: ${durationSec.toFixed(2)}s)`);
                  }
                } else {
                  // Ignore short noises
                  console.log(`[VoiceCall][SimpleVAD] Ignored short utterance (${durationSec.toFixed(2)}s)`);
                }
                silenceTimeout = null;
              }, 500);
            }
          } 
          // Reset silence timer if volume goes back up
          else if (average > VOLUME_THRESHOLD && isSpeechDetected && silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
          
          // Schedule next analysis
          requestAnimationFrame(detectSpeech);
        };
        
        // Start speech detection loop
        detectSpeech();
        console.log('[VoiceCall][SimpleVAD] Started simple volume-based VAD');
        
      } catch (analyzerErr) {
        console.error('[VoiceCall] Failed to setup audio analyzer:', analyzerErr);
        // Continue without VAD - always send audio
        isSpeechDetected = true;
      }
      
      // --- Setup PCM Audio Streaming ---
      // This handles the actual sending of audio data to the backend
      try {
        const pcmContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const pcmSource = pcmContext.createMediaStreamSource(stream);
        const processor = pcmContext.createScriptProcessor(4096, 1, 1);
        
        processorRef.current = processor;
        audioContextRef.current = pcmContext;
        
        processor.onaudioprocess = (e) => {
          if (!initSentRef.current || !wsRef.current || wsRef.current.readyState !== 1) {
            return;
          }
          
          // Only send audio if speech is detected or we're using fallback mode
          if (!isSpeechDetected) {
          return;
        }
          
          const input = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array [-1,1] to 16-bit PCM
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
          
        const pcmBytes = new Uint8Array(pcm.buffer);
          wsRef.current.send(pcmBytes);
          
          if (pcmBytes.length > 0) {
            console.log(`[VoiceCall] [${new Date().toISOString()}] Sent ${pcmBytes.length} bytes of audio to orchestrator`);
          }
        };
        
        pcmSource.connect(processor);
        processor.connect(pcmContext.destination);
        
        console.log('[VoiceCall] PCM audio streaming setup complete');
        
      } catch (pcmErr) {
        console.error('[VoiceCall] Failed to setup PCM streaming:', pcmErr);
        setMicError('Failed to setup audio processing. Please try a different browser.');
        setIsMicActive(false);
      }
      
    } catch (err: any) {
      console.error('[VoiceCall] Microphone access error:', err);
      setMicError('Microphone access denied or unavailable. ' + (err && err.message ? `Reason: ${err.message}` : ''));
      setIsMicActive(false);
    }
  };

  const stopAudioStreaming = () => {
    setIsMicActive(false);
    setIsSpeaking(false);
    
    // Clean up processor
    if (processorRef.current) {
      try {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      } catch (err) {
        console.error('[VoiceCall] Error disconnecting processor:', err);
      }
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      // Run any cleanup function we stored
      if ((audioContextRef.current as any).__vadCleanup) {
        try {
        (audioContextRef.current as any).__vadCleanup();
        } catch (err) {
          console.error('[VoiceCall] Error in VAD cleanup:', err);
        }
      }
      
      // Close the audio context
      try {
      audioContextRef.current.close().catch(err => {
          console.error('[VoiceCall] Error closing AudioContext:', err);
        });
      } catch (err) {
        console.error('[VoiceCall] Error closing AudioContext:', err);
      }
    }
    
    // Stop all media tracks
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (trackErr) {
            console.error('[VoiceCall] Error stopping track:', trackErr);
          }
        });
      } catch (streamErr) {
        console.error('[VoiceCall] Error stopping MediaStream tracks:', streamErr);
      }
    }
    
    // Reset refs
    processorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
    
    console.log('[VoiceCall] Audio streaming stopped');
  };

  // --- Fetch history on mount or sessionId change ---
  useEffect(() => {
    const fetchHistory = async (sid: string) => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8010';
        const res = await axios.get(`${backendUrl}/ws/history/${sid}`);
        if (res.data && Array.isArray(res.data.history)) {
          setHistory(res.data.history);
        }
      } catch (err) {
        console.warn('[VoiceCall] Could not fetch history:', err);
      }
    };
    const storedSessionId = localStorage.getItem('voice_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      fetchHistory(storedSessionId);
    }
  }, []);

  // --- Cleanup on Unmount ---
  useEffect(() => {
    console.log('[VoiceCall] MOUNTED');
    return () => {
      console.log('[VoiceCall] UNMOUNTED');
      stopAudioStreaming();
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
        <h2 className="text-2xl font-bold mb-4">Voice Call</h2>
        <div className="mb-2">Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{status}</span></div>
        <div className="mb-2">Mode: <span className="text-yellow-400">{mode.toUpperCase()}</span></div>
        {showMicPrompt && (
          <div className="flex flex-col items-center mb-4">
            <button
              onClick={handleStartCall}
              className="px-6 py-3 bg-green-600 rounded-full hover:bg-green-700 transition text-lg flex items-center gap-2 shadow-lg"
              aria-label="Start Voice Call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v1.5m0 0a6.75 6.75 0 01-6.75-6.75v-3A6.75 6.75 0 0112 3.75a6.75 6.75 0 016.75 6.75v3a6.75 6.75 0 01-6.75 6.75zm0 0v-1.5" />
              </svg>
              <span>Start Call</span>
            </button>
            <div className="mt-2 text-gray-400 text-sm">Click the mic to start the call</div>
          </div>
        )}
        {/* Conversation History */}
        <div className="mb-4 bg-gray-700 rounded p-3 max-h-48 overflow-y-auto">
          <div className="font-bold text-gray-300 mb-2">Conversation History</div>
          {history.length === 0 ? (
            <div className="text-gray-400">No history yet.</div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className={item.role === 'user' ? 'text-blue-300' : 'text-green-300'}>
                <span className="font-mono text-xs">[{item.role}]</span> {item.text}
              </div>
            ))
          )}
        </div>
        {ttsError && <div className="text-red-500 mb-2">{ttsError}</div>}
        {wsError && <div className="text-red-500 mb-2">{wsError}</div>}
        {micError && (
          <div className="text-red-500 mb-2 font-bold">
            Microphone error: {micError}
            <div className="text-xs mt-1">
              <ul className="list-disc ml-4">
                <li>Allow microphone access in your browser (check the lock icon in the address bar).</li>
                <li>If not on localhost, use HTTPS for mic access.</li>
                <li>Check your OS sound settings and ensure your mic is enabled.</li>
                <li>Close other apps that may be using the mic.</li>
                <li>Try a different browser if the issue persists.</li>
              </ul>
            </div>
          </div>
        )}
        {micError && micError.includes('reload the page') && (
          <div className="mt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition text-white"
            >
              Reload Page
            </button>
          </div>
        )}
        {isConnected && (
          <div className="flex flex-col items-center mb-4">
            <button
              onClick={stopAudioStreaming}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
            >
              End Call
            </button>
            <div className="mt-4 font-mono text-sm flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${isMicActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
              <span>Mic: {isMicActive ? 'Active' : 'Inactive'}</span>
              <span className="ml-4">TTS Playing: {isTTSPlaying ? 'Yes' : 'No'}</span>
              <span className="ml-4">VAD: {isSpeaking ? 'Listening' : 'Silent'}</span>
            </div>
            {/* Fallback audio controls for debugging */}
            {lastAudioUrlRef.current && (
              <audio controls src={lastAudioUrlRef.current} className="w-full mt-2" />
            )}
          </div>
        )}
        {!isConnected && (
          <div className="voice-call-setup">
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
        {isConnected && (
          <div className="mt-4 w-full">
            <div className="bg-gray-700 rounded p-4 min-h-[48px] font-mono text-base whitespace-pre-line">
              {llm2StreamingText ? (
                <span>{llm2StreamingText}<span className="animate-pulse">|</span></span>
              ) : llm2FinalText ? (
                <span>{llm2FinalText}</span>
              ) : (
                <span className="text-gray-400">AI response will appear here...</span>
              )}
            </div>
          </div>
        )}
        <div className="mb-2 flex items-center gap-4">
          <label htmlFor="vad-toggle" className="font-bold">VAD:</label>
          <button
            id="vad-toggle"
            className={`px-3 py-1 rounded ${vadEnabled ? 'bg-green-600' : 'bg-gray-600'} text-white`}
            onClick={() => setVadEnabled(v => !v)}
            disabled={isConnected}
          >
            {vadEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {!isConnected && (
          <div className="mb-4">
            <label className="block font-bold mb-1">System Prompt (AI Persona):</label>
            <textarea
              className="w-full p-2 rounded bg-gray-700 text-white"
              rows={3}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="Describe your AI co-founder persona, background, and behavior..."
            />
            <label className="block font-bold mt-2 mb-1">Greeting Script:</label>
            <textarea
              className="w-full p-2 rounded bg-gray-700 text-white"
              rows={2}
              value={greetingScript}
              onChange={e => setGreetingScript(e.target.value)}
              placeholder="What should Sia say as her greeting?"
            />
          </div>
        )}
      </div>
    </div>
  );
} 