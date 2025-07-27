import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';

interface SimpleVoiceRecorderProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onRecognitionResult: (text: string, confidence: number) => void;
  onError: (error: string) => void;
  onTestAudio?: () => void;
}

export function SimpleVoiceRecorder({ sourceLanguage, targetLanguage, onRecognitionResult, onError, onTestAudio }: SimpleVoiceRecorderProps) {
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
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-gray-500">
          Press and hold to record in {SUPPORTED_LANGUAGES[sourceLanguage].name} → {SUPPORTED_LANGUAGES[targetLanguage].name}
        </div>

        {/* Audio Visualization Bar */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-1 h-8">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            className={`w-20 h-20 rounded-full text-white transition-all duration-200 flex items-center justify-center font-medium ${
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
            {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            onClick={onTestAudio}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Translate Now
          </button>

          <button 
            onClick={async () => {
              console.log('🧪 Testing audio with translation');
              
              try {
                const { reliableAudio } = await import('@/lib/reliable-audio');
                reliableAudio.unlockAudio();
                
                const success = await reliableAudio.speak('Audio test', 'en-US');
                console.log('🧪 Audio test result:', success);
              } catch (error) {
                console.error('🧪 Audio test error:', error);
                alert('Audio test failed: ' + error);
              }
            }}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            🔊 Test Audio
          </button>
        </div>
      </CardContent>
    </Card>
  );
}