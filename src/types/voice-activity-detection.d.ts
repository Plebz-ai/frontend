declare module 'voice-activity-detection' {
  interface VADOptions {
    onSpeechStart: () => void;
    onSpeechEnd: () => void;
    onVADMisfire: () => void;
    onNoise: () => void;
    source: MediaStream;
    voice_stop: number; // ms of silence before triggering end
    voice_start: number; // ms of speech before triggering start
    interval: number;
    debug: boolean;
  }

  /**
   * Voice Activity Detection function
   * @param audioContext The audio context to use
   * @param options VAD configuration options
   * @returns A cleanup function to stop VAD
   */
  export default function VAD(audioContext: AudioContext, options: VADOptions): () => void;
} 