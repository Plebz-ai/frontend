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
  let pcmBuffer: Int16Array = new Int16Array(0);

  // Helper: Convert Float32Array to 16-bit PCM
  function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
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
      // Create WebSocket
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}://${wsHost}/ai-layer/ws/voice-session`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws
      ws.onopen = () => {
        setIsConnected(true)
        // Send INIT with character details
        ws.send(JSON.stringify({ type: 'init', characterDetails }))
        // Start audio processing
        const audioCtx = new window.AudioContext()
        const source = audioCtx.createMediaStreamSource(stream)
        const processor = audioCtx.createScriptProcessor(512, 1, 1)
        source.connect(processor)
        processor.connect(audioCtx.destination)
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0)
          const resampled = resampleTo16kHz(input, audioCtx.sampleRate)
          const pcm = floatTo16BitPCM(resampled)

          // Concatenate new PCM to buffer
          let combined = new Int16Array(pcmBuffer.length + pcm.length)
          combined.set(pcmBuffer, 0)
          combined.set(pcm, pcmBuffer.length)
          pcmBuffer = combined

          // Send 960-sample (1920-byte) chunks
          while (pcmBuffer.length >= 960) {
            const chunk = pcmBuffer.slice(0, 960)
            ws.send(chunk.buffer)
            pcmBuffer = pcmBuffer.slice(960)
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