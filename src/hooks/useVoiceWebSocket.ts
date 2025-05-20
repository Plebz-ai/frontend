import { useEffect, useRef, useState, useCallback } from 'react'

export interface VoiceWebSocketOptions {
  characterDetails: any
  onTranscript?: (transcript: string) => void
  onTTS?: (audioChunk: Uint8Array) => void
  onError?: (err: string) => void
}

export function useVoiceWebSocket({ characterDetails, onTranscript, onTTS, onError }: VoiceWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper: Convert Float32Array to 16-bit PCM
  function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return output
  }

  // Start streaming audio to backend via WebSocket
  const start = useCallback(async () => {
    if (isStreaming) return
    setIsStreaming(true)
    setError(null)
    try {
      // Get mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      // Create WebSocket
      const ws = new WebSocket('ws://localhost:8010/ws/voice-session')
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws
      ws.onopen = () => {
        setIsConnected(true)
        // Send INIT with character details
        ws.send(JSON.stringify({ type: 'init', characterDetails }))
        // Start audio processing
        const audioCtx = new window.AudioContext({ sampleRate: 16000 })
        const source = audioCtx.createMediaStreamSource(stream)
        const processor = audioCtx.createScriptProcessor(1024, 1, 1)
        source.connect(processor)
        processor.connect(audioCtx.destination)
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          const pcm = floatTo16BitPCM(input)
          ws.send(pcm.buffer)
        }
        // Cleanup
        ws.onclose = () => {
          setIsConnected(false)
          setIsStreaming(false)
          processor.disconnect()
          source.disconnect()
          audioCtx.close()
        }
        ws.onerror = (err) => {
          setError('WebSocket error')
          onError && onError('WebSocket error')
        }
        ws.onmessage = (event) => {
          // Expect transcript or TTS audio (PCM)
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data)
              if (msg.type === 'transcript' && onTranscript) onTranscript(msg.text)
            } catch {}
          } else if (event.data instanceof ArrayBuffer) {
            if (onTTS) onTTS(new Uint8Array(event.data))
          }
        }
      }
    } catch (err) {
      setError('Could not access microphone. Please check your browser settings and permissions.')
      onError && onError('Could not access microphone. Please check your browser settings and permissions.')
      setIsStreaming(false)
    }
  }, [characterDetails, isStreaming, onTranscript, onTTS, onError])

  // Stop streaming
  const stop = useCallback(() => {
    setIsStreaming(false)
    if (wsRef.current) wsRef.current.close()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isConnected,
    isStreaming,
    error,
    start,
    stop,
  }
} 