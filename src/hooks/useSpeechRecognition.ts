import { useCallback, useRef } from 'react'

export function useSpeechRecognition() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Helper to check if browser supports streaming POST with ReadableStream and duplex: 'half'
  export function supportsStreamingPost() {
    try {
      new Request('http://localhost', { method: 'POST', body: new ReadableStream(), duplex: 'half' });
      return true;
    } catch (e) {
      return false;
    }
  }

  // Streaming speech-to-text (real-time)
  const startStreamingRecognition = useCallback(async (onTranscript: (transcript: string) => void) => {
    if (!supportsStreamingPost()) {
      alert('Your browser does not support low-latency streaming voice recognition (streaming POST). Please use the latest Chrome or Edge, or use the Voice Call/WebSocket option.');
      return () => {};
    }
    // Robust browser support check
    if (typeof window === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error('Microphone access is not supported in this browser.');
      alert('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Edge, or Firefox.');
      return () => {};
    }
    try {
      console.log('[STT] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('[STT] Microphone permission granted. Stream started:', stream);
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      let controller: AbortController | null = new AbortController()
      let audioQueue: Blob[] = []
      let streamController: ReadableStreamDefaultController<any> | null = null
      const streamForFetch = new ReadableStream({
        start(ctrl) { streamController = ctrl },
        pull() {
          if (audioQueue.length > 0 && streamController) {
            const chunk = audioQueue.shift()
            chunk?.arrayBuffer().then(buf => {
              console.log('[STT] Sending audio chunk to backend. Size:', buf.byteLength)
              streamController?.enqueue(new Uint8Array(buf))
            })
          }
        },
        cancel() { streamController = null }
      })
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioQueue.push(event.data)
          console.log('[STT] Audio chunk available. Size:', event.data.size)
          if (streamController) {
            const chunk = audioQueue.shift()
            chunk?.arrayBuffer().then(buf => {
              console.log('[STT] Sending audio chunk to backend (immediate). Size:', buf.byteLength)
              streamController?.enqueue(new Uint8Array(buf))
            })
          }
        }
      }
      mediaRecorder.onstart = () => console.log('[STT] MediaRecorder started.')
      mediaRecorder.onstop = () => console.log('[STT] MediaRecorder stopped.')
      mediaRecorder.onerror = (e) => console.error('[STT] MediaRecorder error:', e)
      mediaRecorder.start(250) // 250ms chunks
      mediaRecorderRef.current = mediaRecorder
      console.log('[STT] Fetch POST to orchestrator /stream-speech-to-text at http://localhost:8010/stream-speech-to-text')
      const response = await fetch('http://localhost:8010/stream-speech-to-text', {
        method: 'POST',
        body: streamForFetch,
        headers: { 'Content-Type': 'application/octet-stream' },
        signal: controller.signal,
        duplex: 'half'
      })
      console.log('[STT] Fetch POST started. Awaiting response...')
      if (!response.body) {
        throw new Error('No response body from orchestrator STT stream')
      }
      const reader = response.body.getReader()
      let partial = ''
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            console.log('[STT] Streaming STT response ended.')
            return
          }
          const text = new TextDecoder().decode(value)
          partial += text
          onTranscript(partial)
          read()
        })
      }
      read()
      return () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
          mediaRecorderRef.current = null
          console.log('[STT] MediaRecorder stopped (cleanup).')
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
          console.log('[STT] Microphone stream stopped (cleanup).')
        }
        if (controller) {
          controller.abort()
          console.log('[STT] Fetch POST aborted (cleanup).')
        }
      }
    } catch (err) {
      console.error('[STT] Error in streaming STT:', err)
      alert('Could not access microphone. Please check your browser settings and permissions.');
      return () => {};
    }
  }, [])

  return {
    startStreamingRecognition
  }
} 