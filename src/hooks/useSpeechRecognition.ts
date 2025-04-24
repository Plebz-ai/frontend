import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechRecognition() {
  const [isRecordingSupported, setIsRecordingSupported] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  
  useEffect(() => {
    // Check if the browser supports MediaRecorder and getUserMedia
    const isSupported = 
      typeof window !== 'undefined' && 
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function' && 
      window.MediaRecorder;
      
    setIsRecordingSupported(!!isSupported)
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])
  
  const startRecording = useCallback(async (): Promise<Uint8Array | null> => {
    console.log("startRecording called - support status:", isRecordingSupported);
    if (!isRecordingSupported) {
      console.error('Recording is not supported in this browser')
      return null
    }
    
    try {
      // Reset chunks array
      chunksRef.current = []
      console.log("Chunks array reset");
      
      // Get access to the microphone
      console.log("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      console.log("Microphone access granted");
      
      // Create a new MediaRecorder instance
      console.log("Creating MediaRecorder");
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      console.log("MediaRecorder created with MIME type:", mediaRecorder.mimeType);
      
      // Set up data handler
      mediaRecorder.ondataavailable = (event) => {
        console.log("MediaRecorder data available, size:", event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      // Start recording
      console.log("Starting MediaRecorder");
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      console.log("MediaRecorder started, state:", mediaRecorder.state);
      
      // Create a promise that resolves when recording stops
      return new Promise((resolve) => {
        console.log("Waiting for recording to stop...");
        mediaRecorder.onstop = async () => {
          console.log("MediaRecorder stopped. Chunks collected:", chunksRef.current.length);
          // Create a blob from the chunks
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          console.log("Blob created, size:", blob.size);
          
          // Convert blob to array buffer
          console.log("Converting blob to ArrayBuffer");
          const arrayBuffer = await blob.arrayBuffer()
          console.log("ArrayBuffer created, size:", arrayBuffer.byteLength);
          
          // Convert to Uint8Array
          const audioData = new Uint8Array(arrayBuffer)
          console.log("Uint8Array created, length:", audioData.length);
          
          // Clean up
          if (streamRef.current) {
            console.log("Stopping audio tracks");
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
          
          console.log("Resolving promise with audio data");
          resolve(audioData)
        }
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      return null
    }
  }, [isRecordingSupported])
  
  const stopRecording = useCallback(() => {
    console.log("stopRecording called, mediaRecorder state:", mediaRecorderRef.current?.state || "NO_RECORDER");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log("Stopping MediaRecorder");
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
  }, [])
  
  return {
    isRecordingSupported,
    startRecording,
    stopRecording
  }
} 