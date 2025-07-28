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
  translatedText?: string;
  speechRate?: number;
  speechPitch?: number;
  autoPlay?: boolean;
}

export function SimpleVoiceRecorder({ 
  sourceLanguage, 
  targetLanguage, 
  onRecognitionResult, 
  onError, 
  onTestAudio, 
  translatedText,
  speechRate = 0.7,
  speechPitch = 1.0,
  autoPlay = true
}: SimpleVoiceRecorderProps) {
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
            onClick={async () => {
              if (translatedText && translatedText.trim()) {
                console.log('🧪 Testing audio with translation:', translatedText);
                
                try {
                  // Try Samsung-specific fix first
                  const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
                  const targetLangCode = SUPPORTED_LANGUAGES[targetLanguage].code;
                  
                  if (SamsungAudioFix.isSamsungDevice()) {
                    console.log('📱 Using Samsung audio fix');
                    const success = await SamsungAudioFix.speakWithSamsungFix(
                      translatedText, 
                      targetLangCode, 
                      speechRate, 
                      speechPitch
                    );
                    
                    if (!success) {
                      console.log('📱 Samsung fix failed, trying regular speech');
                      // Fallback to regular speech
                      const { speechUtils } = await import('@/lib/speech-utils');
                      await speechUtils.speak({
                        text: translatedText,
                        lang: targetLangCode,
                        rate: speechRate,
                        pitch: speechPitch
                      });
                    }
                  } else {
                    // Regular device - use normal speech utils
                    const { reliableAudio } = await import('@/lib/reliable-audio');
                    reliableAudio.unlockAudio();
                    
                    const { speechUtils } = await import('@/lib/speech-utils');
                    await speechUtils.speak({
                      text: translatedText,
                      lang: targetLangCode,
                      rate: speechRate,
                      pitch: speechPitch
                    });
                  }
                  
                  console.log('🧪 Audio played with custom settings:', { rate: speechRate, pitch: speechPitch });
                } catch (error) {
                  console.error('🧪 Audio test error:', error);
                  alert('Audio test failed: ' + error);
                }
              } else if (onTestAudio) {
                onTestAudio();
              }
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Translate Now
          </button>
        </div>

        {/* Audio Visualization Bar - Small and below buttons */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-0.5 h-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 12 + 6}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}