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
    console.log('🎯 Simple recorder: Touch start');
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
          console.log('🎯 Simple recorder: Speech recognized:', result.transcript);
          setLastResult(`Heard: "${result.transcript}"`);
          
          // Call the parent's callback
          onRecognitionResult(result.transcript, result.confidence || 0.9);
        },
        (error) => {
          console.log('🎯 Simple recorder: Speech error:', error);
          setLastResult(`Error: ${error}`);
          onError(error);
        }
      );
      
    } catch (error) {
      console.error('🎯 Simple recorder: Setup error:', error);
      setIsRecording(false);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    console.log('🎯 Simple recorder: Touch end');
    e.preventDefault();
    e.stopPropagation();
    
    if (!isRecording) return;
    
    setIsRecording(false);
    
    try {
      const { speechUtils } = await import('@/lib/speech-utils');
      speechUtils.stopRecognition();
    } catch (error) {
      console.error('🎯 Simple recorder: Stop error:', error);
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