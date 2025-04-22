import { useCallback, useRef } from 'react'

export function useAudioPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)

  const play = useCallback((audioData: Uint8Array, onEnded?: () => void) => {
    // Clean up any existing audio playback
    stop()
    
    try {
      // Create audio context if it doesn't exist yet
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const context = audioContextRef.current
      
      // Decode the audio data
      context.decodeAudioData(audioData.buffer, (buffer) => {
        // Create a new source node
        const source = context.createBufferSource()
        source.buffer = buffer
        source.connect(context.destination)
        
        if (onEnded) {
          source.onended = onEnded
        }
        
        sourceNodeRef.current = source
        source.start(0)
      }, (error) => {
        console.error('Error decoding audio data:', error)
      })
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }, [])

  const stop = useCallback(() => {
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
        sourceNodeRef.current = null
      }
    } catch (error) {
      console.error('Error stopping audio:', error)
    }
  }, [])

  const isPlaying = useCallback(() => {
    return !!sourceNodeRef.current
  }, [])

  return { play, stop, isPlaying }
} 