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
        <div className="text-gray-500 space-y-1">
          <div>Press and hold to record in {SUPPORTED_LANGUAGES[sourceLanguage].name} → {SUPPORTED_LANGUAGES[targetLanguage].name}</div>
          {typeof window !== 'undefined' && (
            <div className="text-xs space-y-1">
              <div>Device: {(() => {
                const userAgent = navigator.userAgent;
                const userAgentLower = userAgent.toLowerCase();
                
                // Comprehensive Samsung detection
                const samsungKeywords = ['samsung', 'galaxy', 'sm-', 'gt-', 'secbrowser', 'samsungbrowser'];
                const isSamsung = samsungKeywords.some(keyword => userAgentLower.includes(keyword)) ||
                                /sm-[a-z0-9]+/i.test(userAgent) ||
                                /galaxy/i.test(userAgent) ||
                                /samsung/i.test(userAgent);
                
                return isSamsung ? (
                  <span className="text-green-600 font-medium">Samsung - Enhanced Audio Mode</span>
                ) : (
                  <span className="text-blue-600">Standard Mobile</span>
                );
              })()}</div>
              <div className="text-xs text-gray-400 break-all">
                UA: {navigator.userAgent.slice(0, 80)}...
              </div>
              <div className="flex gap-2">
                <button 
                  className="text-xs bg-orange-500 text-white px-2 py-1 rounded"
                  onClick={() => {
                    const userAgent = navigator.userAgent;
                    alert(`User Agent: ${userAgent}\n\nSamsung Keywords Found:\n${
                      ['samsung', 'galaxy', 'sm-', 'gt-', 'secbrowser', 'samsungbrowser']
                        .filter(keyword => userAgent.toLowerCase().includes(keyword))
                        .join(', ') || 'None'
                    }`);
                  }}
                >
                  Debug Device
                </button>
                <button 
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                  onClick={async () => {
                    const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
                    const current = localStorage.getItem('forceSamsungMode') === 'true';
                    if (current) {
                      SamsungAudioFix.disableSamsungMode();
                      alert('Samsung mode disabled - refresh page');
                    } else {
                      SamsungAudioFix.enableSamsungMode();
                      alert('Samsung mode enabled - refresh page');
                    }
                  }}
                >
                  {typeof window !== 'undefined' && localStorage.getItem('forceSamsungMode') === 'true' ? 'Disable Samsung' : 'Enable Samsung'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Samsung Activation Button - Always show on mobile */}
        {typeof window !== 'undefined' && 
         /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && 
         localStorage.getItem('forceSamsungMode') !== 'true' && (
          <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded text-center">
            <div className="text-orange-800 text-sm mb-2">Mobile Audio Enhancement Available</div>
            <button 
              className="bg-orange-600 text-white px-4 py-2 rounded font-medium"
              onClick={async () => {
                const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
                SamsungAudioFix.enableSamsungMode();
                alert('Enhanced audio mode activated! Page will refresh.');
                setTimeout(() => window.location.reload(), 500);
              }}
            >
              Fix Mobile Audio Issues
            </button>
          </div>
        )}

        {/* Show enhanced mode status */}
        {typeof window !== 'undefined' && localStorage.getItem('forceSamsungMode') === 'true' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-center">
            <div className="text-green-800 text-sm font-medium">✓ Enhanced Mobile Audio Mode Active</div>
            <div className="text-green-600 text-xs mt-1">Using server-side TTS for Samsung compatibility</div>
            <button 
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded"
              onClick={async () => {
                // Quick test of server TTS
                try {
                  const audio = new Audio('/api/tts-audio?text=Test&lang=en');
                  await audio.play();
                  alert('Server TTS test successful!');
                } catch (error) {
                  alert('Server TTS test failed: ' + error);
                }
              }}
            >
              Test Audio
            </button>
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
            onClick={async () => {
              if (translatedText && translatedText.trim()) {
                console.log('🧪 Manual audio play requested:', translatedText);
                
                try {
                  // Always try Samsung fix first (it will determine device type internally)
                  const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
                  const targetLangCode = SUPPORTED_LANGUAGES[targetLanguage].code;
                  
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