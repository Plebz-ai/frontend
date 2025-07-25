'use client'

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Settings, X } from 'lucide-react';

interface VoiceCallProps {
  character: any;
  onClose: () => void;
  userPreferences?: any;
}

export default function VoiceCall({ character, onClose, userPreferences }: VoiceCallProps) {
  // Core state
  const [isConnected, setIsConnected] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Status and errors
  const [status, setStatus] = useState<string>('Ready to Connect');
  const [error, setError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  
  // Voice and audio
  const [selectedVoice, setSelectedVoice] = useState<string>(userPreferences?.ttsVoice || 'predefined');
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', text: string}>>([]);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const ttsAudioChunks = useRef<Uint8Array[]>([]);
  const lastAudioUrlRef = useRef<string | null>(null);
  const speechStartTimeRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initSentRef = useRef<boolean>(false);

  // Start call immediately without setup
  const handleStartCall = async () => {
    if (isCallStarted || isStarting) return;
    
    setIsStarting(true);
    setError(null);
    setStatus('Opening Time Bridge...');
    
    try {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8010/ws/voice-session`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
        setStatus('Connected Across Time');
        
        // Send initialization with character details and auto-generated prompts
        const initData = {
        type: 'init',
        characterDetails: {
          ...character,
          ttsVoice: selectedVoice,
            system_prompt: character.description || `You are ${character.name}, a helpful AI assistant.`,
            greeting_script: character.greeting || `Hello! I'm ${character.name}. How can I help you today?`,
            vad_enabled: true
        }
        };
        
        ws.send(JSON.stringify(initData));
      initSentRef.current = true;
        setIsCallStarted(true);
        setIsStarting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'tts_mime_type':
              // Handle TTS audio setup
              console.log('[VoiceCall] Received TTS MIME type:', data.mime_type);
              break;
              
            case 'tts_chunk':
              // Accumulate TTS audio chunks
              try {
                const bytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
                ttsAudioChunks.current.push(bytes);
                console.log('[VoiceCall] Received TTS chunk, size:', bytes.length);
              } catch (err) {
                console.error('Failed to decode audio chunk:', err);
              }
              break;
              
            case 'tts_end':
              // Play accumulated TTS audio
              console.log('[VoiceCall] Received TTS end, chunks:', ttsAudioChunks.current.length);
              if (ttsAudioChunks.current.length > 0) {
                playTTSAudio();
              }
              break;
              
            case 'llm2_partial':
              setCurrentResponse(data.text || '');
              break;
              
            case 'llm2_final':
              setCurrentResponse('');
              setConversationHistory(prev => [...prev, { role: 'assistant', text: data.text || '' }]);
              break;
              
            case 'transcript_final':
              setConversationHistory(prev => [...prev, { role: 'user', text: data.text || '' }]);
              break;
              
            case 'greeting':
              setStatus('Conversation Active');
              break;
              
            case 'error':
              setError(data.error || 'Connection error');
              break;
              
            default:
              console.log('[VoiceCall] Unknown message type:', data.type, data);
              break;
            }
          } catch (err) {
          console.error('Failed to parse message:', err);
          }
      };

      ws.onerror = (e) => {
        setError('Connection failed');
        setStatus('Connection Error');
        setIsStarting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatus('Connection Lost');
        setIsStarting(false);
        stopAudioStreaming();
      };
      
    } catch (err) {
      setError('Failed to start call');
      setIsStarting(false);
    }
  };

  // Play TTS audio
  const playTTSAudio = () => {
    console.log('[VoiceCall] playTTSAudio called with chunks:', ttsAudioChunks.current.length);
            if (ttsAudioChunks.current.length === 0) {
      console.log('[VoiceCall] No audio chunks to play');
              return;
            }
    
    const totalLength = ttsAudioChunks.current.reduce((acc, chunk) => acc + chunk.length, 0);
    console.log('[VoiceCall] Total audio length:', totalLength, 'bytes');
            const merged = new Uint8Array(totalLength);
            let offset = 0;
    
            for (const chunk of ttsAudioChunks.current) {
              merged.set(chunk, offset);
              offset += chunk.length;
            }
    
            ttsAudioChunks.current = [];
    
            if (audioRef.current) {
              audioRef.current.pause();
      if (lastAudioUrlRef.current) {
        URL.revokeObjectURL(lastAudioUrlRef.current);
              }
            }
    
            const blob = new Blob([merged], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            lastAudioUrlRef.current = url;
    
    console.log('[VoiceCall] Created audio blob, size:', blob.size, 'URL:', url);
    
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => {
      console.log('[VoiceCall] Audio playback ended');
              setIsTTSPlaying(false);
              URL.revokeObjectURL(url);
    };
    
    audioRef.current.onerror = (e) => {
      console.error('[VoiceCall] Audio playback error:', e);
      setIsTTSPlaying(false);
      URL.revokeObjectURL(url);
    };
    
    audioRef.current.onloadstart = () => {
      console.log('[VoiceCall] Audio loading started');
    };
    
    audioRef.current.oncanplay = () => {
      console.log('[VoiceCall] Audio can play, duration:', audioRef.current?.duration);
    };
    
    setIsTTSPlaying(true);
    console.log('[VoiceCall] Starting audio playback...');
    
    // Resume audio context if suspended (required for autoplay)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      console.log('[VoiceCall] Resuming suspended audio context...');
      audioContextRef.current.resume().then(() => {
        console.log('[VoiceCall] Audio context resumed');
      });
    }
    
    audioRef.current.play().then(() => {
      console.log('[VoiceCall] Audio playback started successfully');
    }).catch(err => {
      console.error('[VoiceCall] Audio playback failed:', err);
      setIsTTSPlaying(false);
      URL.revokeObjectURL(url);
      
      // If autoplay is blocked, show a message to the user
      if (err.name === 'NotAllowedError') {
        setError('Audio playback blocked. Please click the "Start Voice Call" button again to enable audio.');
      }
    });
  };

  // Start audio streaming
  const startAudioStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            channelCount: 1, 
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
      
      mediaStreamRef.current = stream;
      setIsMicActive(true);

      // Setup audio processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      audioContextRef.current = audioContext;
      processorRef.current = processor;
      
      // Simple volume detection
      const VOLUME_THRESHOLD = 0.01;
      let isSpeechDetected = false;
      
      processor.onaudioprocess = (e) => {
        if (!initSentRef.current || !wsRef.current || wsRef.current.readyState !== 1) return;
        
        const input = e.inputBuffer.getChannelData(0);
          
        // Calculate volume
          let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += Math.abs(input[i]);
        }
        const average = sum / input.length;
        
        // Speech detection
          if (average > VOLUME_THRESHOLD && !isSpeechDetected) {
            isSpeechDetected = true;
            setIsSpeaking(true);
            speechStartTimeRef.current = Date.now();
          
            // Handle barge-in
            if (isTTSPlaying && audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
              setIsTTSPlaying(false);
            wsRef.current?.send(JSON.stringify({ type: 'barge_in' }));
          }
          
          // Clear silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
            }
        } else if (average <= VOLUME_THRESHOLD && isSpeechDetected) {
          // Silence detection
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              isSpeechDetected = false;
              setIsSpeaking(false);
              
              const speechEndTime = Date.now();
              const durationSec = speechStartTimeRef.current
                ? (speechEndTime - speechStartTimeRef.current) / 1000
                : 0;
              
              if (durationSec >= 0.5) { // Minimum utterance duration
                wsRef.current?.send(JSON.stringify({ type: 'end_of_utterance' }));
              }
              
              speechStartTimeRef.current = null;
              silenceTimeoutRef.current = null;
            }, 1200);
          }
          }
          
        // Send audio data
        if (isSpeechDetected) {
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
          
        const pcmBytes = new Uint8Array(pcm.buffer);
          wsRef.current?.send(pcmBytes);
          }
        };
        
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (err: any) {
      console.error('Audio setup failed:', err);
      if (err.name === 'NotAllowedError') {
        setMicError('Microphone access denied. Please allow microphone access in your browser.');
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicError('Microphone setup failed. Please check your microphone and browser settings.');
      }
      setIsMicActive(false);
    }
  };

  // Stop audio streaming
  const stopAudioStreaming = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsMicActive(false);
    setIsSpeaking(false);
  };

  // End call
  const handleEndCall = () => {
    setIsCallStarted(false);
    setIsConnected(false);
    setStatus('Ready to Connect');
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    stopAudioStreaming();
    
    if (audioRef.current) {
      audioRef.current.pause();
      if (lastAudioUrlRef.current) {
        URL.revokeObjectURL(lastAudioUrlRef.current);
      }
    }
    
    setCurrentResponse('');
    setConversationHistory([]);
    setError(null);
    setMicError(null);
    setIsTTSPlaying(false);
    initSentRef.current = false;
  };
    
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
          }
  };

  // Toggle audio
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (audioRef.current) {
      audioRef.current.muted = !isAudioEnabled;
    }
  };

  // Start audio streaming after connection
  useEffect(() => {
    if (isConnected && !isMicActive) {
      startAudioStreaming();
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-900/20 to-purple-900/20 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Voice Bridge</h1>
                <p className="text-sm text-gray-400">Time Bridge Connection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {character && (
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                <span className="text-indigo-400 font-medium text-sm">
                  {character.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{character.name}</p>
                <p className="text-gray-400 text-sm">{character.tagline}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-center p-4 bg-gray-700/30 rounded-xl">
            <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-white">{status}</span>
          </div>

          {/* Error Messages */}
          <AnimatePresence>
            {(error || micError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4"
              >
                <p className="text-red-300 text-sm">{error || micError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Call Controls */}
          {!isCallStarted ? (
            <div className="flex flex-col items-center space-y-6">
              <motion.button
                onClick={handleStartCall}
                disabled={isStarting}
                className="group relative px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 rounded-full transition-all duration-300 text-xl font-semibold flex items-center gap-4 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <Phone className="w-8 h-8" />
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                </div>
                <span>{isStarting ? 'Connecting...' : 'Start Voice Call'}</span>
              </motion.button>
              
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Ready to connect across time</p>
                <p className="text-gray-500 text-xs">Click to begin your conversation with {character?.name}</p>
          </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Call Status */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-700/30 rounded-xl">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isMicActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-400">Microphone</span>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-xl">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isTTSPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-400">Audio</span>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-xl">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-400">Listening</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>

                <motion.button
                  onClick={handleEndCall}
                  className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>

                <motion.button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    !isAudioEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </motion.button>
              </div>

              {/* Live Response */}
              {currentResponse && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <p className="text-white text-sm">
                    {currentResponse}
                    <span className="animate-pulse">|</span>
                  </p>
          </div>
        )}

              {/* Conversation History */}
              {conversationHistory.length > 0 && (
                <div className="bg-gray-700/20 rounded-xl p-4 max-h-48 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Conversation</h3>
                  <div className="space-y-2">
                    {conversationHistory.slice(-6).map((msg, index) => (
                      <div
                        key={index}
                        className={`text-sm ${
                          msg.role === 'user' ? 'text-indigo-300' : 'text-gray-300'
                        }`}
            >
                        <span className="font-medium">{msg.role === 'user' ? 'You: ' : `${character?.name}: `}</span>
                        {msg.text}
                      </div>
                    ))}
                  </div>
          </div>
        )}

              {/* Debug Audio Player */}
              {lastAudioUrlRef.current && (
                <div className="bg-gray-700/20 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Debug Audio</h3>
                  <audio 
                    controls 
                    src={lastAudioUrlRef.current} 
                    className="w-full"
                    onPlay={() => console.log('[VoiceCall] Debug audio started playing')}
                    onError={(e) => console.error('[VoiceCall] Debug audio error:', e)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    If you can hear audio here but not automatically, there may be an autoplay issue.
                  </p>
                </div>
              )}
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
} 