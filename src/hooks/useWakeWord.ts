import { useEffect, useRef, useState } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';

// Path to your custom Sia wake word model and Porcupine base model
const SIA_PPN_PATH = '/models/sia_wakeword.ppn'; // Update with your actual filename
const PORCUPINE_PV_PATH = '/models/porcupine_params.pv';

export function useWakeWord({
  accessKey,
  onWakeWord,
  label = 'Sia',
  autoStart = true,
}: {
  accessKey: string;
  onWakeWord: () => void;
  label?: string;
  autoStart?: boolean;
}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const startedRef = useRef(false);

  const {
    keywordDetection,
    isLoaded,
    isListening: porcupineListening,
    error: porcupineError,
    init,
    start,
    stop,
    release,
  } = usePorcupine();

  // Initialize Porcupine engine
  useEffect(() => {
    if (!accessKey) {
      setError('Missing Picovoice AccessKey');
      return;
    }
    let isMounted = true;
    const initEngine = async () => {
      try {
        await init(
          accessKey,
          [{ publicPath: SIA_PPN_PATH, label }],
          { publicPath: PORCUPINE_PV_PATH }
        );
        if (autoStart) {
          await start();
          startedRef.current = true;
        }
        if (isMounted) setIsReady(true);
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize wake word engine');
      }
    };
    initEngine();
    return () => {
      isMounted = false;
      stop();
      release();
    };
    // eslint-disable-next-line
  }, [accessKey, label, autoStart]);

  // Listen for wake word detection
  useEffect(() => {
    if (keywordDetection && keywordDetection.label === label) {
      onWakeWord();
    }
    // eslint-disable-next-line
  }, [keywordDetection]);

  useEffect(() => {
    setIsListening(porcupineListening);
  }, [porcupineListening]);

  useEffect(() => {
    if (porcupineError) setError(porcupineError.toString());
  }, [porcupineError]);

  return {
    isReady,
    isListening,
    error,
    start,
    stop,
    release,
  };
} 