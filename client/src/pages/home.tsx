import { useState, useCallback, useEffect } from 'react';
import { LanguageSelector } from '@/components/language-selector';
import { SimpleVoiceRecorder } from '@/components/simple-voice-recorder';
import { CleanTranslationResults } from '@/components/clean-translation-results';

import { useTranslation } from '@/hooks/use-translation';
import { type LanguageCode, SUPPORTED_LANGUAGES } from '@shared/schema';
import { Settings, Languages, Mic, Smartphone, ArrowUpDown, X, Volume2, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const [showSettings, setShowSettings] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.7);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [autoPlayTranslation, setAutoPlayTranslation] = useState(true);

  const { translate, isTranslating, translationError, translationResult } = useTranslation();
  const { toast } = useToast();

  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.innerWidth <= 768) ||
    ('ontouchstart' in window);

  const activateMobileAudio = async () => {
    console.log('📱 Activating mobile speech...');
    
    // Log detailed device information for debugging
    const { DeviceDetection } = await import('@/lib/device-detection');
    DeviceDetection.logDeviceInfo();
    
    // Check if Samsung device
    const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
    const isSamsung = SamsungAudioFix.isSamsungDevice();
    
    toast({
      title: isSamsung ? 'Activating Samsung Audio' : 'Activating Mobile Audio',
      description: 'Initializing speech system...',
    });

    try {
      let success = false;
      
      if (isSamsung) {
        console.log('📱 Samsung device detected - using Samsung audio fix');
        success = await SamsungAudioFix.initializeSamsungAudio();
      } else {
        success = await directMobileSpeech.initialize();
      }
      
      setMobileAudioActivated(success);
      
      if (success) {
        console.log('📱 Mobile speech activated');
        toast({
          title: isSamsung ? 'Samsung Audio Ready!' : 'Mobile Audio Ready!',
          description: 'Voice output enabled. Recording translations will now play audio.',
        });
        
        // Test with confirmation message
        setTimeout(async () => {
          try {
            console.log('📱 Attempting confirmation speech...');
            if (isSamsung) {
              await SamsungAudioFix.speakWithSamsungFix('Audio is working', 'en-US');
            } else {
              await directMobileSpeech.speak('Audio is working', 'en-US');
            }
            console.log('📱 Confirmation speech successful');
          } catch (testError) {
            console.warn('📱 Confirmation message failed:', testError);
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
      console.error('📱 Mobile speech error:', error);
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

  // Handle translation result with automatic audio playback
  useEffect(() => {
    console.log('🔍 Translation result effect triggered:', translationResult);
    if (translationResult) {
      console.log('🔍 Setting translated text:', translationResult.translatedText);
      setTranslatedText(translationResult.translatedText);
      setIsProcessing(false);
      
      // Auto-play translated text if auto-play is enabled
      if (autoPlayTranslation && translationResult.translatedText.trim()) {
        console.log('🔊 Auto-playing translation:', translationResult.translatedText);
        playTranslatedText(translationResult.translatedText);
      }
    } else {
      console.log('🔍 No translation result available');
    }
  }, [translationResult, autoPlayTranslation]);

  // Function to play translated text with server-side TTS for Samsung
  const playTranslatedText = async (text: string) => {
    try {
      const targetLangCode = SUPPORTED_LANGUAGES[targetLanguage].code;
      
      // Use server-side TTS for Samsung devices (enhanced mode)
      if (localStorage.getItem('forceSamsungMode') === 'true') {
        console.log('🔊 Using server-side TTS for Samsung device');
        const { ExternalTTS } = await import('@/lib/external-tts');
        
        const success = await ExternalTTS.speakWithExternalService(text, targetLangCode);
        if (success) {
          console.log('🔊 Server-side TTS completed successfully');
          return;
        } else {
          console.log('🔊 Server-side TTS failed, trying fallback');
        }
      }
      
      // iPhone-specific voice output (separate from Samsung system)
      const { iPhoneVoice } = await import('@/lib/iphone-voice');
      console.log('🍎 Checking if device is iPhone...');
      if (iPhoneVoice.isIOSDevice()) {
        console.log('🍎 iPhone device detected, using iPhone voice handler');
        const iPhoneSuccess = await iPhoneVoice.speakOnIPhone(text, targetLangCode);
        if (iPhoneSuccess) {
          console.log('🍎 iPhone voice output completed successfully');
          return;
        } else {
          console.log('🍎 iPhone voice failed, continuing to Samsung fallback');
        }
      } else {
        console.log('🍎 Not an iPhone device, skipping iPhone handler');
      }
      
      // Fallback to enhanced Samsung audio fix
      const { SamsungAudioFix } = await import('@/lib/samsung-audio-fix');
      
      console.log('🔊 Auto-playing with enhanced mobile audio fix');
      const success = await SamsungAudioFix.speakWithSamsungFix(
        text, 
        targetLangCode, 
        speechRate, 
        speechPitch
      );
      
      if (!success) {
        console.log('🔊 Enhanced fix failed, trying standard speech');
        // Fallback to regular speech
        const { reliableAudio } = await import('@/lib/reliable-audio');
        reliableAudio.unlockAudio();
        
        const { speechUtils } = await import('@/lib/speech-utils');
        await speechUtils.speak({
          text,
          lang: targetLangCode,
          rate: speechRate,
          pitch: speechPitch
        });
      }
      
      console.log('🔊 Auto-play completed successfully');
    } catch (error) {
      console.error('🔊 Auto-play failed:', error);
    }
  };

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
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 h-7 w-7 sm:h-8 sm:w-8">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Sliders className="h-5 w-5" />
                    <span>Voice Settings</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Speech Rate */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <span>Speech Speed</span>
                    </Label>
                    <div className="space-y-2">
                      <Slider
                        value={[speechRate]}
                        onValueChange={(value) => setSpeechRate(value[0])}
                        min={0.3}
                        max={1.2}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Slow (0.3x)</span>
                        <span>Current: {speechRate}x</span>
                        <span>Fast (1.2x)</span>
                      </div>
                    </div>
                  </div>

                  {/* Speech Pitch */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center space-x-2">
                      <Mic className="h-4 w-4" />
                      <span>Voice Pitch</span>
                    </Label>
                    <div className="space-y-2">
                      <Slider
                        value={[speechPitch]}
                        onValueChange={(value) => setSpeechPitch(value[0])}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low (0.5)</span>
                        <span>Current: {speechPitch}</span>
                        <span>High (1.5)</span>
                      </div>
                    </div>
                  </div>

                  {/* Auto-play Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-play" className="text-sm font-medium">
                      Auto-play Translations
                    </Label>
                    <Switch
                      id="auto-play"
                      checked={autoPlayTranslation}
                      onCheckedChange={setAutoPlayTranslation}
                    />
                  </div>

                  {/* Test Voice Button */}
                  <Button
                    onClick={() => {
                      const testText = "Testing voice settings with current configuration";
                      speechUtils.speak({
                        text: testText,
                        lang: 'en-US',
                        rate: speechRate,
                        pitch: speechPitch
                      });
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Voice Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
          onTestAudio={testAudio}
          translatedText={translatedText}
          speechRate={speechRate}
          speechPitch={speechPitch}
          autoPlay={autoPlayTranslation}
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
          onTestAudio={testAudio}
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
