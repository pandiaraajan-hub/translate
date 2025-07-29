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
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = async (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRecording) return;
    
    setIsRecording(true);
    
    // Set a timeout to auto-stop recording after 10 seconds (safety measure)
    const timeout = setTimeout(() => {
      setIsRecording(false);
      console.log('🎤 Recording auto-stopped after timeout');
    }, 10000);
    setRecordingTimeout(timeout);
    
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
          
          // Auto-stop recording when we get a result
          setIsRecording(false);
          
          // Clear the timeout since we got a result
          if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            setRecordingTimeout(null);
          }
          
          // Call the parent's callback - this will trigger translation in the parent component
          onRecognitionResult(result.transcript, result.confidence || 0.9);
        },
        (error) => {
          setLastResult(`Error: ${error}`);
          setIsRecording(false); // Also stop recording on error
          
          // Clear the timeout on error
          if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            setRecordingTimeout(null);
          }
          
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
    
    // Clear the timeout when manually stopping
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }
    
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
        <div className="text-gray-500 space-y-1">
          <div>Press and hold to record in {SUPPORTED_LANGUAGES[sourceLanguage].name} → {SUPPORTED_LANGUAGES[targetLanguage].name}</div>

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
                console.log('🧪 Manual audio play requested:', translatedText);
                
                try {
                  const targetLangCode = SUPPORTED_LANGUAGES[targetLanguage].code;
                  
                  // Use server-side TTS for Samsung devices (enhanced mode)
                  if (localStorage.getItem('forceSamsungMode') === 'true') {
                    console.log('📱 Using server-side TTS for Samsung device');
                    const { ExternalTTS } = await import('@/lib/external-tts');
                    
                    const success = await ExternalTTS.speakWithExternalService(translatedText, targetLangCode);
                    if (success) {
                      console.log('📱 Server-side TTS completed successfully');
                      return;
                    } else {
                      console.log('📱 Server-side TTS failed, trying Samsung fallback');
                    }
                  }
                  
                  // iPhone-specific voice output (separate from Samsung system)
                  const { iPhoneVoice } = await import('@/lib/iphone-voice');
                  if (iPhoneVoice.isIOSDevice()) {
                    console.log('🍎 iPhone device detected, using iPhone voice handler');
                    const iPhoneSuccess = await iPhoneVoice.speakOnIPhone(translatedText, targetLangCode);
                    if (iPhoneSuccess) {
                      console.log('🍎 iPhone voice output completed successfully');
                      return;
                    } else {
                      console.log('🍎 iPhone voice failed, continuing to Samsung fallback');
                    }
                  }
                  
                  // Fallback to Samsung audio fix
                  const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
                  
                  console.log('📱 Attempting enhanced mobile audio...');
                  const success = await SamsungAudioFix.speakWithSamsungFix(
                    translatedText, 
                    targetLangCode, 
                    speechRate, 
                    speechPitch
                  );
                  
                  if (!success) {
                    console.log('📱 Enhanced mobile audio failed, using standard audio');
                    // Fallback to regular speech
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
                  
                  console.log('🧪 Manual audio play completed');
                } catch (error) {
                  console.error('🧪 Manual audio play error:', error);
                  alert('Audio play failed: ' + error);
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