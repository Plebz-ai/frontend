'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createWebSocketClient, getWebSocketUrlForCharacter } from '../../lib/websocket'
import { Character } from '../../lib/api'
import { FaMicrophone, FaPhoneSlash, FaVideo, FaVideoSlash, FaPaperPlane, FaSpinner, FaSmile, FaComments, FaTimesCircle } from 'react-icons/fa'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

type CallState = 'idle' | 'connecting' | 'connected' | 'error' | 'ended'

interface Message {
  id: string
  sender: 'user' | 'character'
  content: string
  timestamp: number
}

interface VideoCallProps {
  character: Character
  onClose: () => void
  sessionId: string
  initialMessages?: Message[]
  videoDisabled?: boolean
}

export default function VideoCall({ character, onClose, sessionId, initialMessages = [], videoDisabled = false }: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [usingDummyVideo, setUsingDummyVideo] = useState(true)
  
  // Chat state - make showChat true by default
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { startRecording, stopRecording, isRecordingSupported, startStreamingRecognition } = useSpeechRecognition()
  
  const [liveTranscript, setLiveTranscript] = useState('')
  const [isStreamingSTT, setIsStreamingSTT] = useState(false)
  const streamingStopRef = useRef<null | (() => void)>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  
  const [debouncedTranscript, setDebouncedTranscript] = useState('')
  const [isWaitingToSend, setIsWaitingToSend] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [sttError, setSttError] = useState<string | null>(null)
  const [ttsError, setTtsError] = useState<string | null>(null)
  
  const [ttsBuffering, setTtsBuffering] = useState(false)
  const ttsQueueRef = useRef<string[]>([])
  const ttsPlayingRef = useRef(false)
  
  // Auto-start video call when component mounts
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (callState === 'idle') {
        startLocalVideo();
      }
    }, 500);
    
    // Make sure demo video plays if using dummy video
    const ensureDemoVideoPlays = () => {
      if (usingDummyVideo) {
        const demoVideo = document.querySelector('video[src="/videos/video.mp4"]') as HTMLVideoElement;
        if (demoVideo) {
          demoVideo.volume = 0.7; // Set volume to 70%
          demoVideo.play()
            .then(() => console.log('Demo video with audio auto-started'))
            .catch(err => {
              console.error('Error auto-starting demo video:', err);
              // If autoplay with audio fails, try again with user interaction
              const startAudioButton = document.createElement('button');
              startAudioButton.textContent = 'Click to enable audio';
              startAudioButton.className = 'absolute top-12 left-3 z-20 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold shadow-lg';
              startAudioButton.onclick = () => {
                demoVideo.play();
                startAudioButton.remove();
              };
              const container = demoVideo.parentElement;
              if (container) container.appendChild(startAudioButton);
            });
        }
      }
    };

    // Try to play the video after component is fully mounted
    const videoTimer = setTimeout(ensureDemoVideoPlays, 1000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(videoTimer);
    };
  }, [callState, usingDummyVideo]);
  
  // Log initialMessages when component mounts
  useEffect(() => {
    console.log('Video call started with session ID:', sessionId);
    console.log('Initial messages loaded:', initialMessages.length);
    if (initialMessages.length > 0) {
      console.log('First message:', initialMessages[0]?.content);
      console.log('Last message:', initialMessages[initialMessages.length - 1]?.content);
    }
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, showChat]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Always use a new clientId for each connection
    const clientId = Math.random().toString(36).substring(7)
    const wsClient = createWebSocketClient(
      character,
      clientId,
      sessionId,
      (data) => {
        if (data.type === 'video') {
          handleVideoData(data.content)
        } else if (data.type === 'call_state') {
          setCallState(data.content.state)
        } else if (data.type === 'error') {
          setError(data.content.message)
          setCallState('error')
        } else if (data.type === 'chat') {
          setMessages((prev) => [...prev, data.content])
          setIsTyping(false)
        } else if (data.type === 'typing') {
          setIsTyping(true)
        } else if (data.type === 'chat_history') {
          if (data.content && Array.isArray(data.content.messages)) {
            if (initialMessages.length === 0) {
              setMessages(data.content.messages)
            }
          }
        }
      },
      () => {
        setIsConnected(true)
        setCallState('connected')
        if (initialMessages.length === 0 && sessionId) {
          wsClient.sendMessage('get_chat_history', {
            character_id: character.id,
            session_id: sessionId
          })
        }
      },
      () => {
        setIsConnected(false)
        setCallState('error')
        setError('Connection lost. Please try again.')
      },
      (err) => {
        setError('WebSocket error: ' + (err?.message || err))
      }
    )
    wsClientRef.current = wsClient
    return () => {
      cleanup()
    }
  }, [character.id, sessionId, initialMessages.length])

  // Start streaming STT when call is connected
  useEffect(() => {
    if (callState === 'connected' && isRecordingSupported && !isStreamingSTT) {
      setIsStreamingSTT(true)
      setSttError(null)
      streamingStopRef.current = startStreamingRecognition((transcript) => {
        setLiveTranscript(transcript)
      })
      // Patch: catch errors from streaming
      if (typeof streamingStopRef.current === 'function') {
        // No error
      } else if (streamingStopRef.current && streamingStopRef.current.error) {
        setSttError('Microphone or streaming error. Please check permissions and try again.')
        setIsStreamingSTT(false)
      }
    }
    return () => {
      if (streamingStopRef.current) streamingStopRef.current()
      setIsStreamingSTT(false)
      setLiveTranscript('')
    }
  }, [callState, isRecordingSupported, startStreamingRecognition])

  // Streaming TTS playback for character responses (buffered)
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.sender !== 'character' || !lastMsg.content) return
    let abort = false
    setIsTTSPlaying(true)
    setTtsError(null)
    setTtsBuffering(true)
    ttsQueueRef.current = []
    ttsPlayingRef.current = false
    // Stop any current audio before starting new
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    const playBufferedChunks = async () => {
      // Wait for enough chunks or a timeout
      let bufferTimeout: NodeJS.Timeout | null = null
      let chunks: Uint8Array[] = []
      let playing = false
      const playBuffer = (buffer: Uint8Array[]) => {
        if (buffer.length === 0) return
        const totalLength = buffer.reduce((acc, arr) => acc + arr.length, 0)
        const merged = new Uint8Array(totalLength)
        let offset = 0
        for (const arr of buffer) {
          merged.set(arr, offset)
          offset += arr.length
        }
        const blob = new Blob([merged], { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (!audioRef.current) {
          audioRef.current = new Audio()
          audioRef.current.onended = () => setIsTTSPlaying(false)
        }
        audioRef.current.src = url
        audioRef.current.play().catch(() => setTtsError('Audio playback failed.'))
        audioRef.current.onended = () => {
          URL.revokeObjectURL(url)
          setIsTTSPlaying(false)
        }
      }
      // Buffering loop
      while (!abort) {
        if (ttsQueueRef.current.length > 0) {
          // Decode and buffer all available chunks
          while (ttsQueueRef.current.length > 0) {
            const base64 = ttsQueueRef.current.shift()!
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            chunks.push(bytes)
          }
          // If enough data or not already playing, play buffer
          if (chunks.length > 0 && !playing) {
            playing = true
            setTtsBuffering(false)
            playBuffer(chunks)
            chunks = []
          }
        }
        await new Promise(res => setTimeout(res, 60))
      }
    }
    const fetchAndBuffer = async () => {
      try {
        const resp = await fetch('/ai-layer/stream-text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: lastMsg.content, voice_type: character.voice_type || 'predefined' })
        })
        if (!resp.body) throw new Error('No response body from TTS stream')
        const reader = resp.body.getReader()
        let partial = ''
        while (!abort) {
          const { done, value } = await reader.read()
          if (done) break
          const text = new TextDecoder().decode(value)
          partial += text
          if (partial.length > 0) {
            ttsQueueRef.current.push(partial)
            partial = ''
          }
        }
      } catch (err) {
        setIsTTSPlaying(false)
        setTtsError('TTS streaming failed. Please try again.')
      }
    }
    playBufferedChunks()
    fetchAndBuffer()
    return () => { abort = true; setIsTTSPlaying(false); setTtsBuffering(false) }
  }, [messages, character.voice_type])

  // Debounce transcript sending
  useEffect(() => {
    if (!liveTranscript) return
    setIsWaitingToSend(true)
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    // If transcript ends with sentence-ending punctuation, send immediately
    if (/[.!?]\s*$/.test(liveTranscript)) {
      setDebouncedTranscript(liveTranscript)
      setIsWaitingToSend(false)
      return
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedTranscript(liveTranscript)
      setIsWaitingToSend(false)
    }, 600)
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    }
  }, [liveTranscript])

  // Send debounced transcript to LLM/character
  useEffect(() => {
    if (debouncedTranscript.trim().length > 0 && wsClientRef.current) {
      wsClientRef.current.sendMessage('chat', {
        content: debouncedTranscript.trim(),
        mode: 'voice',
        audio_data: '',
      })
      setDebouncedTranscript('')
      setLiveTranscript('')
    }
  }, [debouncedTranscript])

  const cleanup = () => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
    setCallState('idle')
  }

  const handleVideoData = (content: any) => {
    if (!content || !videoRef.current) return
    
    // Real video data received, turn off dummy video
    setUsingDummyVideo(false)
    
    // If content is a base64 string, convert to Blob
    if (typeof content === 'string') {
      const byteCharacters = atob(content)
      const byteArrays = []
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      
      const blob = new Blob(byteArrays, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      
      videoRef.current.src = url
      
      // Clean up the URL when video is loaded
      videoRef.current.onloadeddata = () => {
        URL.revokeObjectURL(url)
      }
    } 
    // If content is a Blob URL or data URL, use directly
    else if (content.url) {
      videoRef.current.src = content.url
    }
  }

  const startLocalVideo = async () => {
    try {
      setCallState('connecting')
      
      console.log('Requesting camera access...')
      
      // First set up the video element
      const videoElement = document.getElementById('localVideoElement') as HTMLVideoElement
      console.log('Local video element found:', !!videoElement)
      
      // Only request audio if videoDisabled is true
      const constraints = videoDisabled ? { audio: true, video: false } : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera access granted, setting up stream')
      
      streamRef.current = stream
      
      // Mark streaming as active first, which ensures the video element is visible
      setIsStreaming(true)
      
      // Short timeout to make sure the element is fully rendered
      setTimeout(() => {
        // Try to use the ref first, as it's more reliable
        if (localVideoRef.current) {
          console.log('Using React ref to set video stream')
          localVideoRef.current.srcObject = stream
          localVideoRef.current.play()
            .then(() => console.log('Local video started via ref'))
            .catch(err => console.error('Error playing via ref:', err))
        } 
        // Fall back to direct DOM access
        else if (videoElement) {
          console.log('Using DOM element to set video stream')
          videoElement.srcObject = stream
          videoElement.play()
            .then(() => console.log('Local video started via DOM'))
            .catch(err => console.error('Error playing via DOM:', err))
        } else {
          console.error('Could not find video element by any method')
        }
      }, 100)
      
      // Send a message to start streaming
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('start_stream', {
          character_id: character.id,
          video_enabled: !videoDisabled,
          audio_enabled: true
        })
      }
      
      // Ensure video element loads the demo video if in dummy mode
      if (!videoDisabled && videoRef.current) {
        const dummyVideoElement = document.querySelector('video[src="/videos/video.mp4"]') as HTMLVideoElement;
        if (dummyVideoElement) {
          dummyVideoElement.volume = 0.7; // Set volume to 70%
          dummyVideoElement.play()
            .then(() => console.log('Demo video started playing with audio'))
            .catch(err => {
              console.error('Error playing demo video:', err);
              // Add a visible button for user to click to start audio (browser policy may block auto audio)
              const audioButton = document.createElement('button');
              audioButton.textContent = 'Enable Audio';
              audioButton.className = 'absolute top-12 left-3 z-20 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-bold shadow-lg';
              audioButton.onclick = () => {
                dummyVideoElement.play();
                audioButton.remove();
              };
              const container = dummyVideoElement.parentElement;
              if (container) container.appendChild(audioButton);
            });
        }
      }
      
      setCallState('connected')
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Could not access camera or microphone. Please check permissions.')
      setCallState('error')
    }
  }

  const endCall = () => {
    console.log('Ending call and cleaning up resources')
    cleanup()
    onClose()
    
    // Add a small delay and then refresh the page
    setTimeout(() => {
      console.log('Refreshing page to update chat history')
      window.location.reload()
    }, 100)
  }

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
      
      // Notify server of mute state change
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('stream_config', {
          audio_enabled: !isMuted
        })
      }
    }
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
      
      // Notify server of video state change
      if (wsClientRef.current) {
        wsClientRef.current.sendMessage('stream_config', {
          video_enabled: !isVideoOff
        })
      }
    }
  }

  const toggleChat = () => {
    setShowChat(!showChat)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !wsClientRef.current) return
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    }
    wsClientRef.current.sendMessage('chat', message)
    setMessages(prev => [...prev, message])
    setInputMessage('')
    setIsTyping(true)
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const handleStartRecording = async () => {
    console.log("Recording started");
    if (isRecording) return
    
    setIsRecording(true)
    
    try {
      console.log("Awaiting startRecording()");
      const audioData = await startRecording()
      console.log("Audio data received:", audioData ? `Yes, length: ${audioData.length}` : "No");
      
      if (audioData && wsClientRef.current) {
        console.log("WebSocket client available:", !!wsClientRef.current);
        
        // Convert Uint8Array to base64 string
        console.log("Converting to base64");
        const binary = Array.from(audioData).map(byte => String.fromCharCode(byte)).join('')
        const base64String = btoa(binary)
        console.log("Base64 string created, length:", base64String.length);
        
        console.log("Sending via WebSocket");
        const success = wsClientRef.current.sendMessage('audio', { data: base64String })
        console.log("WebSocket send result:", success ? "Success" : "Failed");
      } else {
        console.log("No audio data or WebSocket client is null. Audio data:", !!audioData, "WebSocket:", !!wsClientRef.current);
      }
    } catch (error) {
      console.error('Recording error:', error)
      setError('Could not access microphone')
    } finally {
      setIsRecording(false)
      console.log("Recording ended");
    }
  }

  const handleStopRecording = () => {
    stopRecording()
    setIsRecording(false)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Retry STT handler
  const handleRetrySTT = () => {
    setSttError(null)
    setIsStreamingSTT(false)
    setTimeout(() => setIsStreamingSTT(true), 100)
  }

  // In the VideoCall component, set usingDummyVideo to false if videoDisabled is true
  useEffect(() => {
    if (videoDisabled) {
      setUsingDummyVideo(false);
    }
  }, [videoDisabled]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl p-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Video Call with {character.name}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={toggleChat}
              className={`p-2 ${showChat ? 'bg-indigo-600' : 'bg-gray-700'} text-white rounded-full hover:bg-indigo-500`}
              aria-label={showChat ? "Hide chat" : "Show chat"}
            >
              <FaComments className="w-5 h-5" />
            </button>
            <button
              onClick={endCall}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <FaPhoneSlash className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main video area */}
          <div className={`relative ${showChat ? 'w-2/3' : 'w-full'} transition-all duration-300 bg-black rounded-lg overflow-hidden`}>
            {callState === 'idle' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={startLocalVideo}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  Start Video Call
                </button>
              </div>
            ) : callState === 'connecting' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-xl">Connecting...</div>
              </div>
            ) : callState === 'error' ? (
              <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                <div className="text-red-400">
                  <p className="text-xl font-semibold mb-2">Connection Error</p>
                  <p>{error || "Could not establish video call"}</p>
                  <button
                    onClick={startLocalVideo}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Replace video with direct HTML when using dummy video */}
                {!videoDisabled && usingDummyVideo ? (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-lg z-10">
                      DEMO MODE
                    </div>
                    <video
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      src="/videos/video.mp4"
                    />
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </>
            )}
            
            {/* Local video preview - Always render the container, but conditionally apply CSS */}
            {!videoDisabled && (
              <div className={`absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-indigo-500 shadow-lg z-50 ${isStreaming ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <video
                  id="localVideoElement"
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                ></video>
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center">
                    <FaVideoSlash className="w-8 h-8 text-white opacity-60" />
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full bg-black bg-opacity-50 px-2 py-1 text-sm text-white">
                  You 
                </div>
              </div>
            )}
            
            {/* Call controls */}
            {callState === 'connected' && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                  onTouchStart={handleStartRecording}
                  onTouchEnd={handleStopRecording}
                  className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                    isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-800'
                  } text-white`}
                >
                  <FaMicrophone className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-green-400'}`} />
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                    isVideoOff ? 'bg-red-600' : 'bg-gray-800'
                  } text-white`}
                >
                  {isVideoOff ? <FaVideoSlash className="w-5 h-5" /> : <FaVideo className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {/* Chat panel */}
          {showChat && (
            <div className="w-1/3 flex flex-col ml-4 bg-[#151722] rounded-lg overflow-hidden border border-[#343a4f]">
              <div className="p-3 border-b border-[#292d3e] flex justify-between items-center">
                <h3 className="text-white font-medium">Chat</h3>
                <button onClick={toggleChat} className="text-gray-400 hover:text-white">
                  <FaTimesCircle className="w-4 h-4" />
                </button>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" 
                   style={{ backgroundColor: '#0d0f17' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-4">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isFirstInGroup = index === 0 || messages[index-1].sender !== message.sender;
                    
                    return (
                      <div
                        key={message.id}
                        className={`${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'} flex`}
                      >
                        {message.sender === 'character' && isFirstInGroup && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium mr-2 mt-1 shadow-md">
                            {character.name.charAt(0)}
                          </div>
                        )}
                        {message.sender === 'character' && !isFirstInGroup && (
                          <div className="w-8 mr-2"></div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`relative max-w-[85%] ${
                            message.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tl-2xl rounded-tr-md rounded-br-md rounded-bl-2xl shadow-lg'
                              : 'bg-[#202536] text-gray-100 rounded-tr-2xl rounded-tl-md rounded-br-2xl rounded-bl-md shadow border border-[#343a4f]'
                          } px-4 py-3`}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                          <div className={`mt-1 text-xs flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-center gap-1.5 opacity-70`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                )}

                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex justify-start mt-2"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium shadow-md">
                          {character.name.charAt(0)}
                        </div>
                        <div className="bg-[#202536] border border-[#343a4f] rounded-2xl px-4 py-2 shadow-md">
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} className="h-1" />
              </div>
              
              {/* Chat input */}
              <div className="p-3 border-t border-[#292d3e]">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative">
                  <div className="relative flex-1 bg-[#202536] rounded-2xl shadow-inner">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      disabled={!isConnected}
                      placeholder={isConnected ? `Message ${character.name}...` : "Connecting..."}
                      className="w-full p-3 pl-4 pr-10 bg-transparent text-white border border-[#343a4f] rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none min-h-[48px] max-h-[120px] placeholder-gray-500"
                      rows={1}
                    />
                    
                    <button
                      type="button"
                      className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <FaSmile className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!isConnected || !inputMessage.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow"
                    aria-label="Send message"
                  >
                    {isTyping ? (
                      <FaSpinner className="w-5 h-5 animate-spin" />
                    ) : (
                      <FaPaperPlane className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      {isStreamingSTT && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 px-4 py-2 rounded shadow text-black z-50">
          <span className="font-mono text-sm">{liveTranscript || 'Listening...'}{isWaitingToSend && <span className="ml-2 animate-pulse text-indigo-600">...</span>}</span>
        </div>
      )}
      {isTTSPlaying && (
        <div className="fixed bottom-36 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded shadow z-50 animate-pulse">
          <span className="font-mono text-sm">Speaking...</span>
        </div>
      )}
      {ttsBuffering && (
        <div className="fixed bottom-44 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded shadow z-50 animate-pulse">
          <span className="font-mono text-sm">Buffering audio...</span>
        </div>
      )}
      {sttError && (
        <div className="fixed bottom-52 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          <span className="font-mono text-sm">{sttError}</span>
          <button onClick={handleRetrySTT} className="ml-4 px-3 py-1 bg-white text-red-600 rounded font-bold">Retry</button>
        </div>
      )}
      {ttsError && (
        <div className="fixed bottom-60 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          <span className="font-mono text-sm">{ttsError}</span>
        </div>
      )}
    </div>
  )
} 