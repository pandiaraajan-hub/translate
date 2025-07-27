import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SimpleVoiceRecorderProps {
  sourceLanguage: string;
  onRecognitionResult: (text: string, confidence: number) => void;
  onError: (error: string) => void;
}

export function SimpleVoiceRecorder({ sourceLanguage, onRecognitionResult, onError }: SimpleVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleTouchStart = async (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRecording) return;
    
    setIsRecording(true);
    
    try {
      // Import speech utils dynamically
      const { speechUtils } = await import('@/lib/speech-utils');
      
      speechUtils.startRecognition(
        'english',
        async (result) => {
          setLastResult(`Heard: "${result.transcript}"`);
          
          // Call the parent's callback
          onRecognitionResult(result.transcript, result.confidence || 0.9);
          
          // Automatically translate and play audio
          try {
            const { apiRequest } = await import('@/lib/queryClient');
            const translation = await apiRequest('/api/translate', {
              method: 'POST',
              body: {
                text: result.transcript,
                sourceLanguage: 'english',
                targetLanguage: 'tamil'
              }
            });
            
            setLastResult(`Translation: "${translation.translatedText}"`);
            
            // Play Tamil audio immediately with mobile support
            if (translation.translatedText) {
              const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              
              if (isMobile) {
                // Use force-mobile-audio for reliable mobile playback
                const { forceMobileAudio } = await import('@/lib/force-mobile-audio');
                forceMobileAudio.enableAudioFromTouch();
                forceMobileAudio.speakImmediately(translation.translatedText, 'ta');
              } else {
                // Desktop playback
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(translation.translatedText);
                utterance.lang = 'ta-IN';
                utterance.rate = 0.8;
                utterance.volume = 1.0;
                
                const voices = speechSynthesis.getVoices();
                const tamilVoice = voices.find(v => v.lang.includes('ta')) || 
                                 voices.find(v => v.lang.includes('hi')) ||
                                 voices.find(v => v.lang.includes('en'));
                
                if (tamilVoice) {
                  utterance.voice = tamilVoice;
                }
                
                speechSynthesis.speak(utterance);
              }
            }
            
          } catch (error) {
            setLastResult('Translation failed');
          }
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
        <h2 className="text-lg font-semibold">VoiceBridge</h2>
        <p className="text-sm text-gray-600">Pandi Tech</p>
        
        <div className="space-y-4">
          {isRecording && (
            <div className="text-red-600 font-medium animate-pulse">
              🎙️ Recording... Release to translate
            </div>
          )}
          
          {!isRecording && (
            <div className="text-gray-500">
              Press and hold to record in English → Tamil
            </div>
          )}

          <button
            className={`w-20 h-20 rounded-full text-white transition-all duration-200 flex items-center justify-center font-medium ${
              isRecording 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          {lastResult && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm">
              {lastResult}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}