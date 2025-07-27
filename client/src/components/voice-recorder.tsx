import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';
import { Mic, Square, Trash2, Play } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

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

  const [audioLevels, setAudioLevels] = useState<number[]>(Array(10).fill(8));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Real audio visualization based on microphone input
  useEffect(() => {
    const startAudioVisualization = async () => {
      if (!isRecording) {
        // Stop audio visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        setAudioLevels(Array(10).fill(8));
        return;
      }

      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Create audio context and analyser
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Animation loop for real-time audio visualization
        const updateAudioLevels = () => {
          if (!analyserRef.current || !isRecording) return;

          analyser.getByteFrequencyData(dataArray);
          
          // Generate bar heights based on frequency bins
          const newLevels = Array(10).fill(0).map((_, index) => {
            const binIndex = Math.floor((index / 10) * dataArray.length);
            const value = dataArray[binIndex] || 0;
            // Scale to appropriate height (8-48px range)
            return Math.max(8, Math.min(48, (value / 255) * 40 + 8));
          });

          setAudioLevels(newLevels);
          
          if (isRecording) {
            animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
          }
        };

        updateAudioLevels();

      } catch (error) {
        console.error('Error accessing microphone for visualization:', error);
        // Fallback to basic animation if mic access fails
        const interval = setInterval(() => {
          if (!isRecording) return;
          setAudioLevels(levels => 
            levels.map(() => Math.random() * 32 + 8)
          );
        }, 100);

        return () => clearInterval(interval);
      }
    };

    startAudioVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
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
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-red-600">
            Speech recognition is not supported in this browser.
          </p>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Recommended browsers:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Google Chrome (recommended)</li>
              <li>Microsoft Edge</li>
              <li>Safari (on macOS/iOS)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Voice Recording</h2>
            <p className="text-sm text-gray-500">
              Tap the microphone and speak clearly in {SUPPORTED_LANGUAGES[sourceLanguage].name}
            </p>
            <p className="text-xs text-gray-400">
              Make sure your microphone is enabled and speak close to your device
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
          {isRecording && (
            <div className="text-xs text-red-600 font-medium animate-pulse">
              🎙️ Listening... Release when done speaking
            </div>
          )}

          {/* Main Recording Button with Audio Visualization */}
          <div className="flex items-center justify-center space-x-4 sm:space-x-6">
            {/* Audio Visualization - Left Side */}
            <div className="flex items-end justify-center space-x-1 h-12 sm:h-16">
              {audioLevels.slice(0, 5).map((level, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isRecording ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                  style={{ height: `${Math.max(level, 6)}px` }}
                />
              ))}
            </div>

            {/* Recording Button */}
            <Button
              size="lg"
              data-recording-button
              className={`w-24 h-24 sm:w-20 sm:h-20 rounded-full text-white text-2xl transition-all duration-200 ripple ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 recording-pulse active:bg-red-700' 
                  : 'bg-primary hover:bg-blue-700 active:bg-blue-800'
              }`}
              onClick={handleToggleRecording}
            >
              {isRecording ? <Square className="h-7 w-7 sm:h-6 sm:w-6" /> : <Mic className="h-7 w-7 sm:h-6 sm:w-6" />}
            </Button>

            {/* Audio Visualization - Right Side */}
            <div className="flex items-end justify-center space-x-1 h-12 sm:h-16">
              {audioLevels.slice(5).map((level, index) => (
                <div
                  key={index + 5}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isRecording ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                  style={{ height: `${Math.max(level, 6)}px` }}
                />
              ))}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 transition-colors"
              onClick={handleClear}
              disabled={!result && !error}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            {result && (
              <div className="text-xs text-green-600 font-medium">
                ✓ Recording successful
              </div>
            )}
          </div>


        </div>
      </CardContent>
    </Card>
  );
}
