import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';

interface SimpleVoiceRecorderProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onRecognitionResult: (text: string, confidence: number) => void;
  onError: (error: string) => void;
}

export function SimpleVoiceRecorder({ sourceLanguage, targetLanguage, onRecognitionResult, onError }: SimpleVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleTouchStart = async (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRecording) return;
    
    setIsRecording(true);
    
    try {
      // Initialize audio system on touch start
      const { reliableAudio } = await import('@/lib/reliable-audio');
      reliableAudio.unlockAudio();
      
      // Import speech utils dynamically
      const { speechUtils } = await import('@/lib/speech-utils');
      
      speechUtils.startRecognition(
        sourceLanguage,
        async (result) => {
          setLastResult(`Heard: "${result.transcript}"`);
          
          // Call the parent's callback - this will trigger translation in the parent component
          onRecognitionResult(result.transcript, result.confidence || 0.9);
        },
        (error) => {
          setLastResult(`Error: ${error}`);
          onError(error);
        }
      );
      
    } catch (error) {
      setIsRecording(false);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isRecording) return;
    
    setIsRecording(false);
    
    try {
      const { speechUtils } = await import('@/lib/speech-utils');
      speechUtils.stopRecognition();
    } catch (error) {
      // Handle error silently
    }
  };

  return (
    <div className="text-center space-y-4">
      {isRecording && (
        <div className="text-red-600 font-medium animate-pulse">
          Recording...
        </div>
      )}
      
      <button
        className={`w-24 h-24 rounded-full text-white transition-all duration-200 flex items-center justify-center font-medium shadow-lg ${
          isRecording 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={(e) => handleTouchStart(e as any)}
        onMouseUp={(e) => handleTouchEnd(e as any)}
        onMouseLeave={(e) => handleTouchEnd(e as any)}
      >
        {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
      </button>

      <p className="text-sm text-gray-500">
        Hold to speak
      </p>
    </div>
  );
}