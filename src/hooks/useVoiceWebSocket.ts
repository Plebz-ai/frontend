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

  // Buffer for accumulating PCM samples
  let pcmBuffer: Int16Array = new Int16Array(0)
  let ws: WebSocket | null = null

  // Helper: Convert Float32Array to 16-bit PCM
  function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return output
  }

  // Helper: Resample Float32Array to 16kHz
  function resampleTo16kHz(input: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000) return input;
    const sampleRateRatio = inputSampleRate / 16000;
    const newLength = Math.round(input.length / sampleRateRatio);
    const output = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const idx = i * sampleRateRatio;
      const idx1 = Math.floor(idx);
      const idx2 = Math.min(idx1 + 1, input.length - 1);
      const frac = idx - idx1;
      output[i] = input[idx1] * (1 - frac) + input[idx2] * frac;
    }
    return output;
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
      // Create WebSocket to orchestrator, not STT service
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://localhost:8010/ws/voice-session`;
      ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws
      ws.onopen = () => {
        setIsConnected(true)
        // Send INIT with character details
        ws.send(JSON.stringify({ type: 'init', characterDetails }))
        // Start audio processing
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
        const source = audioCtx.createMediaStreamSource(stream)
        const processor = audioCtx.createScriptProcessor(4096, 1, 1)
        source.connect(processor)
        processor.connect(audioCtx.destination)
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          const pcm = floatTo16BitPCM(input)
          // Concatenate new PCM to buffer
          let combined = new Int16Array(pcmBuffer.length + pcm.length)
          combined.set(pcmBuffer, 0)
          combined.set(pcm, pcmBuffer.length)
          pcmBuffer = combined
          // Only send if we have at least 16,000 samples (1 second)
          if (pcmBuffer.length >= 16000) {
            let offset = 0
            while (pcmBuffer.length - offset >= 960) {
              const chunk = pcmBuffer.slice(offset, offset + 960)
              ws?.send(chunk.buffer)
              offset += 960
            }
            // Keep any remainder in the buffer
            pcmBuffer = pcmBuffer.slice(offset)
            console.log('[VoiceWS] Sent', offset, 'samples to orchestrator')
          }
        }
        // Cleanup
        ws.onclose = (event) => {
          setIsConnected(false)
          setIsStreaming(false)
          processor.disconnect()
          source.disconnect()
          audioCtx.close()
          const reason = event && event.reason ? event.reason : 'WebSocket closed';
          setError('WebSocket closed: ' + reason + ' (code: ' + (event && event.code) + ')')
          if (onError) onError('WebSocket closed: ' + reason + ' (code: ' + (event && event.code) + ')')
          console.error('WebSocket closed:', event)
        }
        ws.onerror = (err) => {
          let errorMsg = 'WebSocket error';
          if (err && typeof err === 'object' && 'message' in err) {
            errorMsg = 'WebSocket error: ' + (err as any).message;
          } else if (err && typeof err === 'object' && 'type' in err) {
            errorMsg = 'WebSocket error: ' + (err as any).type;
          }
          setError(errorMsg)
          if (onError) onError(errorMsg)
          console.error('WebSocket error:', err)
        }
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'transcript' || msg.type === 'transcript_final') {
              console.log('[VoiceWS] Transcript:', msg.text)
              if (onTranscript) onTranscript(msg.text)
            } else if (msg.type === 'tts_chunk' || msg.type === 'MSG_TYPE_TTS_CHUNK') {
              // Handle TTS audio chunk (base64)
              if (onTTS && msg.audio) {
                const binary = atob(msg.audio)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                onTTS(bytes)
              }
            } else if (msg.type === 'tts_end' || msg.type === 'MSG_TYPE_TTS_END') {
              // Signal end of TTS stream
              if (onTTS) onTTS(null)
            } else if (msg.type === 'error') {
              console.error('[VoiceWS] Error:', msg.error)
              if (onError) onError(msg.error)
            } else {
              console.log('[VoiceWS] Message:', msg)
            }
          } catch (e) {
            console.error('[VoiceWS] Non-JSON message:', event.data)
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