import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';
import { Mic, Square, Trash2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VoiceRecorderProps {
  sourceLanguage: LanguageCode;
  onRecognitionResult: (text: string, confidence: number) => void;
  onError: (error: string) => void;
}

export function VoiceRecorder({
  sourceLanguage,
  onRecognitionResult,
  onError,
}: VoiceRecorderProps) {
  const {
    isRecording,
    isSupported,
    result,
    error,
    startRecording,
    stopRecording,
    clearResult,
    clearError,
  } = useSpeechRecognition();

  const [audioLevels, setAudioLevels] = useState<number[]>(Array(10).fill(0));

  // Handle recognition result
  useEffect(() => {
    if (result) {
      onRecognitionResult(result.transcript, result.confidence);
    }
  }, [result, onRecognitionResult]);

  // Handle recognition error
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Simulate audio visualization during recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevels(levels => 
          levels.map(() => Math.random() * 40 + 10)
        );
      }, 100);
    } else {
      setAudioLevels(Array(10).fill(10));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearError();
      startRecording(sourceLanguage);
    }
  };

  const handleClear = () => {
    clearResult();
    clearError();
  };

  const getRecordingStatus = () => {
    if (isRecording) return 'Recording... Speak now';
    if (result) return 'Recording complete';
    return `Ready to record in ${SUPPORTED_LANGUAGES[sourceLanguage].name}`;
  };

  const getRecordingStatusColor = () => {
    if (isRecording) return 'text-red-600';
    if (result) return 'text-green-600';
    return 'text-gray-500';
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">
            Speech recognition is not supported in this browser. 
            Please use Chrome, Firefox, or Safari for the best experience.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-gray-900">Voice Recording</h2>
            <p className="text-sm text-gray-500">
              Tap the microphone and speak in {SUPPORTED_LANGUAGES[sourceLanguage].name}
            </p>
          </div>

          {/* Recording Status */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-red-500 recording-pulse' : 
              result ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className={getRecordingStatusColor()}>
              {getRecordingStatus()}
            </span>
          </div>

          {/* Main Recording Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`w-20 h-20 rounded-full text-white text-2xl transition-all duration-200 ripple ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 recording-pulse' 
                  : 'bg-primary hover:bg-blue-700'
              }`}
              onClick={handleToggleRecording}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
              onClick={handleClear}
              disabled={!result && !error}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Audio Visualization */}
          <div className="flex items-end justify-center space-x-1 h-12">
            {audioLevels.map((level, index) => (
              <div
                key={index}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isRecording ? 'bg-primary' : 'bg-gray-300'
                }`}
                style={{ height: `${Math.max(level, 4)}px` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
