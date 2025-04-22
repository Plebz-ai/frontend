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
      navigator.mediaDevices.getUserMedia && 
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
    if (!isRecordingSupported) {
      console.error('Recording is not supported in this browser')
      return null
    }
    
    try {
      // Reset chunks array
      chunksRef.current = []
      
      // Get access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      // Set up data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      // Start recording
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      
      // Create a promise that resolves when recording stops
      return new Promise((resolve) => {
        mediaRecorder.onstop = async () => {
          // Create a blob from the chunks
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          
          // Convert blob to array buffer
          const arrayBuffer = await blob.arrayBuffer()
          
          // Convert to Uint8Array
          const audioData = new Uint8Array(arrayBuffer)
          
          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
          
          resolve(audioData)
        }
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      return null
    }
  }, [isRecordingSupported])
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
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