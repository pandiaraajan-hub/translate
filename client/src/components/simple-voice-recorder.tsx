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
  const [isProcessing, setIsProcessing] = useState(false);

  const handleButtonPress = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🎤 Button pressed, current state:', { isRecording, isProcessing });
    
    // Prevent multiple rapid presses
    if (isProcessing) {
      console.log('🎤 Still processing, ignoring press');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsProcessing(true);
    
    if (isRecording) {
      console.log('🎤 Stopping recording');
      stopRecording();
    } else {
      console.log('🎤 Starting recording');
      startRecording();
    }
    
    // Reset processing flag after short delay
    setTimeout(() => setIsProcessing(false), 200);
  };

  const startRecording = () => {
    
    console.log('🎤 Starting recording');
    setIsRecording(true);
    setLastResult('Listening...');
    
    // Safety timeout
    const timeout = setTimeout(() => {
      stopRecording();
    }, 30000);
    setRecordingTimeout(timeout);
    
    // Start speech recognition
    (async () => {
      try {
        const { reliableAudio } = await import('@/lib/reliable-audio');
        reliableAudio.unlockAudio();
        
        const { speechUtils } = await import('@/lib/speech-utils');
        await speechUtils.startRecognition(
          sourceLanguage,
          (result) => {
            console.log('🎤 Speech result received:', result.transcript);
            setLastResult(`"${result.transcript}"`);
            console.log('🎤 Calling onRecognitionResult callback');
            onRecognitionResult(result.transcript, result.confidence || 0.9);
          },
          (error) => {
            setLastResult(`Error: ${error}`);
            stopRecording();
            onError(error);
          }
        );
      } catch (error) {
        console.error('🎤 Start error:', error);
        setLastResult('Failed to start');
        stopRecording();
      }
    })();
  };

  const stopRecording = () => {
    console.log('🎤 Stopping recording');
    setIsRecording(false);
    setLastResult('Stopped');
    
    // Clear timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }
    
    // Stop speech recognition
    import('@/lib/speech-utils').then(({ speechUtils }) => {
      speechUtils.stopRecognition();
    }).catch(console.error);
  };

  // Remove the old touch handlers since we're using toggle mode now

  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-gray-500 space-y-1">
          <div>{isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'} in {SUPPORTED_LANGUAGES[sourceLanguage].name} → {SUPPORTED_LANGUAGES[targetLanguage].name}</div>
        </div>





        <div className="flex flex-col items-center justify-center gap-4">
          <button
            className={`w-20 h-20 rounded-full text-white transition-all duration-200 flex items-center justify-center font-medium ${
              isRecording
                ? 'bg-red-500 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleButtonPress}
            onMouseDown={(e) => {
              console.log('🎤 Mouse down event');
              e.preventDefault();
            }}
            style={{ 
              userSelect: 'none', 
              WebkitUserSelect: 'none',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          
          {/* Status text */}
          <div className="text-sm text-gray-600">
            {isRecording ? 'Recording... Tap to stop' : 'Tap to start'}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
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
                  console.log('📱 Checking if device is iPhone...');
                  if (iPhoneVoice.isIOSDevice()) {
                    console.log('📱 iPhone device detected, using iPhone voice handler');
                    const iPhoneSuccess = await iPhoneVoice.speakOnIPhone(translatedText, targetLangCode);
                    if (iPhoneSuccess) {
                      console.log('📱 iPhone voice output completed successfully');
                      return;
                    } else {
                      console.log('📱 iPhone voice failed, continuing to Samsung fallback');
                    }
                  } else {
                    console.log('📱 Not an iPhone device, skipping iPhone handler');
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