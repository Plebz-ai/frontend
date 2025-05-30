'use client'

import React, { useEffect, useRef, useState } from 'react';
import VAD from 'voice-activity-detection';

// Remove the inline type definitions since we now have them in the declaration file
interface VoiceCallProps {
  character: any;
  onClose: () => void;
  userPreferences?: any; // Optionally pass user preferences
}

export default function VoiceCall({ character, onClose, userPreferences }: VoiceCallProps) {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Idle');
  const [showMicPrompt, setShowMicPrompt] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(userPreferences?.ttsVoice || 'predefined');
  const [isStarting, setIsStarting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [llm2StreamingText, setLlm2StreamingText] = useState<string>("");
  const [llm2FinalText, setLlm2FinalText] = useState<string>("");

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
      if (isSafari) {
        console.log('[VoiceCall] Safari browser detected. Using special handling.');
      }
      
      // --- Permissions API check ---
      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (perm.state === 'denied') {
            setMicError('Microphone access is denied in your browser settings. Please allow mic access (click the lock icon in the address bar).');
            setIsMicActive(false);
            setIsStarting(false);
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
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
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
        setIsStarting(false);
        setShowMicPrompt(true);
        return;
      }
      console.log('[VoiceCall] getUserMedia returned:', stream);
      if (!(stream instanceof MediaStream)) {
        setMicError('Browser did not return a valid MediaStream. Try a hard refresh (Ctrl+Shift+R) or use a different browser.');
        setIsMicActive(false);
        setIsStarting(false);
        setShowMicPrompt(true);
        return;
      }
      // --- NEW: Check for audio tracks ---
      if (!stream.getAudioTracks || !stream.getAudioTracks().length) {
        setMicError('No audio tracks found in MediaStream. Please check your mic and browser settings, and ensure your mic is not in use by another app.');
        setIsMicActive(false);
        setIsStarting(false);
        setShowMicPrompt(true);
        return;
      }
      mediaStreamRef.current = stream;
      
      // Safari-specific AudioContext workaround
      let audioContextOptions: AudioContextOptions | undefined = { sampleRate: 16000 };
      if (isSafari) {
        // Safari sometimes needs a more basic configuration
        audioContextOptions = undefined; // Use default options in Safari
        console.log('[VoiceCall] Using default AudioContext options for Safari');
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(audioContextOptions);
      audioContextRef.current = audioContext;
      let source: MediaStreamAudioSourceNode | null = null;
      try {
        // Explicitly log what we're passing to createMediaStreamSource
        console.log('[VoiceCall] Creating MediaStreamSource with:', 
          stream instanceof MediaStream ? 'Valid MediaStream' : 'Invalid MediaStream',
          'tracks:', stream.getAudioTracks().length,
          'active:', stream.active);
          
        source = audioContext.createMediaStreamSource(stream);
        console.log('[VoiceCall] MediaStreamSource created successfully');
      } catch (err: any) {
        console.error('[VoiceCall] createMediaStreamSource error:', err);
        if (err && err.message && err.message.includes("parameter 1 is not of type 'MediaStream'")) {
          // Try a different approach for problematic browsers
          try {
            if (isSafari) {
              // Special handling for Safari
              console.log('[VoiceCall] Attempting Safari-specific workaround');
              // Wait a moment before trying again
              await new Promise(resolve => setTimeout(resolve, 500));
              // Try again with current track
              const audioTrack = stream.getAudioTracks()[0];
              if (audioTrack) {
                const newStream = new MediaStream([audioTrack]);
                source = audioContext.createMediaStreamSource(newStream);
                console.log('[VoiceCall] Safari workaround successful');
              }
            } else {
              setMicError('Browser context error: Mic cannot be activated due to a browser bug. Please reload the page (Ctrl+Shift+R) or close and reopen the tab.');
              setIsMicActive(false);
              setIsStarting(false);
              setShowMicPrompt(true);
              return;
            }
          } catch (err2) {
            console.error('[VoiceCall] Workaround also failed:', err2);
            setMicError('Browser context error: Mic cannot be activated in this browser. Please try using Chrome or Firefox.');
            setIsMicActive(false);
            setIsStarting(false);
            setShowMicPrompt(true);
            return;
          }
        } else {
          setMicError('Microphone access error: ' + (err && err.message ? err.message : 'Unknown error'));
          setIsMicActive(false);
          setIsStarting(false);
          setShowMicPrompt(true);
          return;
        }
      }
      
      if (!source) {
        setMicError('Failed to create audio source. Please try using a different browser.');
        setIsMicActive(false);
        setIsStarting(false);
        setShowMicPrompt(true);
        return;
      }
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsMicActive(true);

      // --- VAD Integration ---
      let vadCleanup = null;
      let speechActive = false;
      
      try {
        // Create a clone of the MediaStream to ensure it's a valid MediaStream object
        const clonedStream = new MediaStream();
        stream.getAudioTracks().forEach(track => {
          clonedStream.addTrack(track.clone());
        });
        
        console.log('[VoiceCall][VAD] Created cloned MediaStream:', clonedStream instanceof MediaStream, 
          'tracks:', clonedStream.getAudioTracks().length);
        
        const vadOptions = {
          onSpeechStart: () => {
            setIsSpeaking(true);
            speechActive = true;
            console.log('[VoiceCall][VAD] Speech started');
            // --- Barge-in logic ---
            if (isTTSPlaying && audioRef.current) {
              audioRef.current.pause();
              setIsTTSPlaying(false);
              if (wsRef.current && wsRef.current.readyState === 1 && initSentRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
                console.log('[VoiceCall][VAD] Sent barge_in marker');
              }
              console.log('[VoiceCall][VAD] Barge-in: TTS playback stopped due to user speech');
            }
          },
          onSpeechEnd: () => {
            setIsSpeaking(false);
            speechActive = false;
            console.log('[VoiceCall][VAD] Speech ended');
            // Send end_of_utterance marker to backend
            if (wsRef.current && wsRef.current.readyState === 1 && initSentRef.current) {
              wsRef.current.send(JSON.stringify({ type: 'end_of_utterance' }));
              console.log('[VoiceCall][VAD] Sent end_of_utterance marker');
            }
          },
          onVADMisfire: () => {},
          onNoise: () => {},
          source: clonedStream, // Use the cloned stream
          voice_stop: 250, // ms of silence before triggering end
          voice_start: 100, // ms of speech before triggering start
          interval: 50,
          debug: false,
        };
        
        // Use the VAD function directly since we have the type definitions
        try {
          console.log('[VoiceCall][VAD] Initializing VAD with audioContext:', 
            audioContext instanceof AudioContext);
          vadCleanup = VAD(audioContext, vadOptions);
          console.log('[VoiceCall][VAD] VAD initialized successfully');
        } catch (vadErr: any) {
          console.error('[VoiceCall][VAD] VAD initialization error:', vadErr);
          // Fall back to a simple implementation without VAD
          speechActive = true; // Always send audio
          // Create a fake cleanup function
          vadCleanup = () => { 
            console.log('[VoiceCall][VAD] Fake VAD cleanup called'); 
          };
        }
      } catch (streamErr: any) {
        console.error('[VoiceCall][VAD] Stream preparation error:', streamErr);
        // Continue without VAD
        speechActive = true; // Always send audio
      }

      processor.onaudioprocess = (e) => {
        if (!initSentRef.current) {
          // Don't send audio until INIT is sent
          return;
        }
        
        const input = e.inputBuffer.getChannelData(0);
        
        // If VAD failed, implement a simple volume-based speech detection
        if (speechActive === true && vadCleanup && typeof vadCleanup === 'function' && vadCleanup.toString().includes('Fake VAD')) {
          // Calculate audio volume (RMS)
          let sum = 0;
          for (let i = 0; i < input.length; i++) {
            sum += input[i] * input[i];
          }
          const rms = Math.sqrt(sum / input.length);
          
          // Threshold for speech detection (adjust as needed)
          const SPEECH_THRESHOLD = 0.01;
          const isSpeaking = rms > SPEECH_THRESHOLD;
          
          // Update UI if speech state changed
          if (isSpeaking !== prevSpeakingRef.current) {
            setIsSpeaking(isSpeaking);
            prevSpeakingRef.current = isSpeaking;
            
            // If speech started and TTS is playing, implement barge-in
            if (isSpeaking && isTTSPlaying && audioRef.current) {
              audioRef.current.pause();
              setIsTTSPlaying(false);
              if (wsRef.current && wsRef.current.readyState === 1 && initSentRef.current) {
                wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
                console.log('[VoiceCall][Fallback VAD] Sent barge_in marker');
              }
            }
            
            // If speech ended, send end_of_utterance
            if (!isSpeaking && wsRef.current && wsRef.current.readyState === 1 && initSentRef.current) {
              wsRef.current.send(JSON.stringify({ type: 'end_of_utterance' }));
              console.log('[VoiceCall][Fallback VAD] Sent end_of_utterance marker');
            }
          }
        }
        
        if (!speechActive) {
          // Only send audio when VAD says user is speaking
          return;
        }
        
        // Convert Float32Array [-1,1] to 16-bit PCM
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const pcmBytes = new Uint8Array(pcm.buffer);
        if (wsRef.current && wsRef.current.readyState === 1) {
          wsRef.current.send(pcmBytes);
          if (pcmBytes.length > 0) {
            console.log(`[VoiceCall] [${new Date().toISOString()}] Sent ${pcmBytes.length} bytes of audio to orchestrator`);
          }
        }
      };
      // Store cleanup for VAD
      if (audioContextRef.current) {
        (audioContextRef.current as any).__vadCleanup = vadCleanup;
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
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (audioContextRef.current) {
      // Cleanup VAD
      if ((audioContextRef.current as any).__vadCleanup) {
        (audioContextRef.current as any).__vadCleanup();
      }
      audioContextRef.current.close().catch(err => {
        console.error('[VoiceCall] Error closing AudioContext:', err);
      });
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    processorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
  };

  // --- Start Call Handler ---
  const handleStartCall = async () => {
    if (isCallStarted || isStarting || (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1))) {
      console.warn('[VoiceCall] Start call ignored: already started or connecting');
      return; // Prevent double start
    }
    setIsStarting(true);
    setShowMicPrompt(false);
    setTtsError(null);
    setWsError(null);
    setMicError(null);

    // 1. Prompt for mic access first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      console.log('[VoiceCall] getUserMedia returned:', stream);
      if (!(stream instanceof MediaStream)) {
        setMicError('Browser did not return a valid MediaStream. Try reloading or using a different browser.');
        setIsMicActive(false);
        setIsStarting(false);
        setShowMicPrompt(true);
        return;
      }
      mediaStreamRef.current = stream;
      setIsMicActive(true);
    } catch (err: any) {
      console.error('[VoiceCall] Microphone access error:', err);
      setMicError('Microphone access denied or unavailable. ' + (err && err.message ? `Reason: ${err.message}` : ''));
      setIsMicActive(false);
      setIsStarting(false);
      setShowMicPrompt(true);
      return;
    }

    // 2. Only proceed if mic access granted
    setIsCallStarted(true);
    setStatus('Connecting...');
    console.log('[VoiceCall] Opening WebSocket connection...');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8010/ws/voice-session`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[VoiceCall] Connected successfully');
      setIsConnected(true);
      setStatus('Connected');
      if (!initSentRef.current) {
        ws.send(JSON.stringify({ type: 'init', characterDetails: { ...character, ttsVoice: selectedVoice } }));
        initSentRef.current = true;
        console.log(`[VoiceCall] [${new Date().toISOString()}] INIT message sent`);
      } else {
        console.warn('[VoiceCall] INIT message already sent, skipping');
      }
      setIsStarting(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('Disconnected');
      stopAudioStreaming();
      setIsStarting(false);
    };

    ws.onerror = (e) => {
      setWsError('WebSocket error');
      setStatus('Error');
      stopAudioStreaming();
      setIsStarting(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[VoiceCall] WebSocket message received:', data);

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
          if (!audioStreamingStartedRef.current) {
            startAudioStreaming();
            console.log('[VoiceCall] Audio streaming started after greeting');
          }
        } else if (data.type === 'error') {
          setTtsError(data.error || 'TTS error');
        } else if (data.type === 'llm2_partial') {
          setLlm2StreamingText(data.text || "");
        } else if (data.type === 'llm2_final') {
          setLlm2FinalText(data.text || "");
          setLlm2StreamingText("");
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
    stopAudioStreaming();
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
    setMicError(null);
    audioStreamingStartedRef.current = false;
    initSentRef.current = false;
    onClose();
  };

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
        {!isCallStarted && (
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
        {isCallStarted && (
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
      </div>
    </div>
  );
} 