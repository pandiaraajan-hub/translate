import { useState, useCallback, useEffect } from 'react';
import { LanguageSelector } from '@/components/language-selector';
import { SimpleVoiceRecorder } from '@/components/simple-voice-recorder';
import { CleanTranslationResults } from '@/components/clean-translation-results';

import { useTranslation } from '@/hooks/use-translation';
import { type LanguageCode, SUPPORTED_LANGUAGES } from '@shared/schema';
import { Settings, Languages, Mic, Smartphone, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { mobileAudio } from '@/lib/mobile-audio';
import { speechUtils } from '@/lib/speech-utils';
import { directMobileSpeech } from '@/lib/direct-mobile-speech';

export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('english');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('tamil');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobileAudioActivated, setMobileAudioActivated] = useState(false);

  const { translate, isTranslating, translationError, translationResult } = useTranslation();
  const { toast } = useToast();

  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768) ||
    ('ontouchstart' in window);

  const activateMobileAudio = async () => {
    console.log('📱 Activating direct mobile speech...');
    
    toast({
      title: 'Activating Mobile Audio',
      description: 'Initializing speech system...',
    });

    try {
      const success = await directMobileSpeech.initialize();
      setMobileAudioActivated(success);
      
      if (success) {
        console.log('📱 Direct mobile speech activated');
        toast({
          title: 'Mobile Audio Ready!',
          description: 'Voice output enabled. Recording translations will now play audio.',
        });
        
        // Test with confirmation message - multiple attempts
        setTimeout(async () => {
          try {
            console.log('📱 Attempting confirmation speech...');
            await directMobileSpeech.speak('Audio is working', 'en-US');
            console.log('📱 Confirmation speech successful');
          } catch (testError) {
            console.warn('📱 Confirmation message failed:', testError);
            // Try backup approach
            setTimeout(async () => {
              try {
                await directMobileSpeech.speak('Ready', 'en-US');
              } catch (backupError) {
                console.warn('📱 Backup confirmation failed:', backupError);
              }
            }, 1000);
          }
        }, 1200);
        
      } else {
        toast({
          title: 'Mobile Audio Setup Failed',
          description: 'Check device volume and try again. Some browsers may block audio.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('📱 Direct mobile speech error:', error);
      toast({
        title: 'Audio System Error',
        description: 'Failed to initialize mobile audio. Try refreshing the page.',
        variant: 'destructive',
      });
    }
  };

  const testAudio = async () => {
    try {
      if (isMobile) {
        console.log('📱 Testing direct mobile speech...');
        if (directMobileSpeech.isInitialized()) {
          await directMobileSpeech.speak('Audio test successful', 'en-US');
        } else {
          throw new Error('Mobile audio not initialized. Please activate it first.');
        }
      } else {
        console.log('🖥️ Testing desktop audio...');
        await speechUtils.speak({
          text: 'Desktop audio test successful',
          lang: 'en-US'
        });
      }
      toast({
        title: 'Audio Test Complete',
        description: 'Did you hear the test message?',
      });
    } catch (error) {
      console.error('Audio test failed:', error);
      toast({
        title: 'Audio Test Failed',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Handle translation when source text changes
  useEffect(() => {
    if (sourceText.trim() && sourceLanguage !== targetLanguage) {
      setIsProcessing(true);
      translate({
        text: sourceText,
        from: SUPPORTED_LANGUAGES[sourceLanguage].code,
        to: SUPPORTED_LANGUAGES[targetLanguage].code,
      });
    } else {
      setTranslatedText('');
    }
  }, [sourceText, sourceLanguage, targetLanguage, translate]);

  // Handle translation result
  useEffect(() => {
    console.log('🔍 Translation result effect triggered:', translationResult);
    if (translationResult) {
      console.log('🔍 Setting translated text:', translationResult.translatedText);
      setTranslatedText(translationResult.translatedText);
      setIsProcessing(false);
    } else {
      console.log('🔍 No translation result available');
    }
  }, [translationResult]);

  // Handle translation error
  useEffect(() => {
    if (translationError) {
      setError(`Translation failed: ${translationError.message}`);
      setIsProcessing(false);
      toast({
        title: 'Translation Error',
        description: translationError.message,
        variant: 'destructive',
      });
    }
  }, [translationError, toast]);

  const handleSourceLanguageChange = useCallback((language: LanguageCode) => {
    if (language === targetLanguage) {
      // If selecting same as target, swap them
      setTargetLanguage(sourceLanguage);
    }
    setSourceLanguage(language);
  }, [sourceLanguage, targetLanguage]);

  const handleTargetLanguageChange = useCallback((language: LanguageCode) => {
    if (language === sourceLanguage) {
      // If selecting same as source, swap them
      setSourceLanguage(targetLanguage);
    }
    setTargetLanguage(language);
  }, [sourceLanguage, targetLanguage]);

  const handleSwapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    // Also swap the texts
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  }, [sourceLanguage, targetLanguage, sourceText, translatedText]);

  const handleRecognitionResult = useCallback((text: string, recognitionConfidence: number) => {
    console.log('🏠 Home handleRecognitionResult called with:', text, recognitionConfidence);
    setSourceText(text);
    setConfidence(recognitionConfidence);
    setError(null);
  }, []);

  const handleRecognitionError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setSourceText('');
    setTranslatedText('');
    setConfidence(undefined);
  }, []);



  const handleSourceTextChange = useCallback((text: string) => {
    setSourceText(text);
  }, []);

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* Header - Compact */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                <Languages className="text-white h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-medium text-gray-900">VoiceBridge</h1>
                <p className="text-xs text-gray-500">Pandi Tech</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 h-7 w-7 sm:h-8 sm:w-8">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
            </Button>
          </div>

        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3 sm:space-y-4 pb-6">
        {/* Language Selector */}
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={handleSourceLanguageChange}
          onTargetLanguageChange={handleTargetLanguageChange}
          onSwapLanguages={handleSwapLanguages}
        />

        {/* Voice Recorder */}
        <SimpleVoiceRecorder
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onRecognitionResult={handleRecognitionResult}
          onError={handleRecognitionError}
        />

        {/* Processing Indicator - Compact */}
        {(isTranslating || isProcessing) && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-sm">
                  <span className="processing-dots">Translating</span>
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Translation Results */}
        <CleanTranslationResults
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          sourceText={sourceText}
          translatedText={translatedText}
          confidence={confidence}
          isPlaying={false}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissError}
                    className="text-destructive hover:text-destructive/80"
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              {error.includes('No speech detected') && (
                <div className="mt-3 p-3 bg-red-50 rounded-md text-sm">
                  <p className="font-medium text-red-800 mb-2">Troubleshooting Tips:</p>
                  <ul className="text-red-700 space-y-1 list-disc list-inside">
                    <li>Make sure your microphone is not muted</li>
                    <li>Speak clearly and close to your device</li>
                    <li>Check if browser has microphone permission</li>
                    <li>Try speaking a bit louder or for longer</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}
