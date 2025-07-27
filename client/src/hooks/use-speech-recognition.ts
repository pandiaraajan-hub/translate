import { useState, useCallback, useRef } from 'react';
import { speechUtils, type SpeechRecognitionResult } from '@/lib/speech-utils';
import { type LanguageCode } from '@shared/schema';

export interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  isSupported: boolean;
  result: SpeechRecognitionResult | null;
  error: string | null;
  startRecording: (language: LanguageCode) => void;
  stopRecording: () => void;
  clearResult: () => void;
  clearError: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<SpeechRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentLanguage = useRef<LanguageCode | null>(null);

  const isSupported = speechUtils.isRecognitionSupported();

  const startRecording = useCallback((language: LanguageCode) => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    if (isRecording) {
      return;
    }

    setIsRecording(true);
    setResult(null);
    setError(null);
    currentLanguage.current = language;

    speechUtils.startRecognition(
      language,
      (recognitionResult) => {
        if (recognitionResult.transcript.trim()) {
          setResult(recognitionResult);
        } else {
          setError('No speech detected. Please speak clearly and try again.');
        }
        setIsRecording(false);
      },
      (errorMessage) => {
        let userFriendlyError = errorMessage;
        if (errorMessage.includes('not-allowed')) {
          userFriendlyError = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (errorMessage.includes('no-speech')) {
          userFriendlyError = 'No speech detected. Please speak clearly and try again.';
        } else if (errorMessage.includes('network')) {
          userFriendlyError = 'Network error. Please check your connection and try again.';
        }
        setError(userFriendlyError);
        setIsRecording(false);
      }
    );
  }, [isSupported, isRecording]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      speechUtils.stopRecognition();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRecording,
    isSupported,
    result,
    error,
    startRecording,
    stopRecording,
    clearResult,
    clearError,
  };
}
