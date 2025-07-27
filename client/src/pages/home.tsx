import { useState, useCallback, useEffect } from 'react';
import { LanguageSelector } from '@/components/language-selector';
import { VoiceRecorder } from '@/components/voice-recorder';
import { TranslationResults } from '@/components/translation-results';
import { RecentTranslations } from '@/components/recent-translations';
import { useTranslation } from '@/hooks/use-translation';
import { type LanguageCode, type Translation, SUPPORTED_LANGUAGES } from '@shared/schema';
import { Settings, Languages, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('chinese');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('english');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { translate, isTranslating, translationError, translationResult } = useTranslation();
  const { toast } = useToast();

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
    if (translationResult) {
      setTranslatedText(translationResult.translatedText);
      setIsProcessing(false);
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
    setSourceText(text);
    setConfidence(recognitionConfidence);
    setError(null);
  }, []);

  const handleRecognitionError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleSelectRecentTranslation = useCallback((translation: Translation) => {
    // Find the language codes for the selected translation
    const sourceLang = Object.entries(SUPPORTED_LANGUAGES).find(
      ([_, config]) => config.code === translation.sourceLanguage
    )?.[0] as LanguageCode;
    
    const targetLang = Object.entries(SUPPORTED_LANGUAGES).find(
      ([_, config]) => config.code === translation.targetLanguage
    )?.[0] as LanguageCode;

    if (sourceLang && targetLang) {
      setSourceLanguage(sourceLang);
      setTargetLanguage(targetLang);
      setSourceText(translation.sourceText);
      setTranslatedText(translation.translatedText);
      setConfidence(parseFloat(translation.confidence || '0'));
    }
  }, []);

  const handleSourceTextChange = useCallback((text: string) => {
    setSourceText(text);
  }, []);

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Languages className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-medium text-gray-900">VoiceBridge</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Multi-Language Voice Translator</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20">
        {/* Language Selector */}
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={handleSourceLanguageChange}
          onTargetLanguageChange={handleTargetLanguageChange}
          onSwapLanguages={handleSwapLanguages}
        />

        {/* Voice Recorder */}
        <VoiceRecorder
          sourceLanguage={sourceLanguage}
          onRecognitionResult={handleRecognitionResult}
          onError={handleRecognitionError}
        />

        {/* Processing Indicator */}
        {(isTranslating || isProcessing) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">
                  <span className="processing-dots">Processing translation</span>
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Translation Results */}
        <TranslationResults
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          sourceText={sourceText}
          translatedText={translatedText}
          confidence={confidence}
          onSourceTextChange={handleSourceTextChange}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissError}
                  className="text-destructive hover:text-destructive/80"
                >
                  ×
                </Button>
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

        {/* Recent Translations */}
        <RecentTranslations onSelectTranslation={handleSelectRecentTranslation} />
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-20 sm:hidden">
        <Button
          size="lg"
          className="w-16 h-16 rounded-full bg-primary hover:bg-blue-700 shadow-lg ripple active:bg-blue-800"
          onClick={() => {
            document.querySelector('[data-recording-button]')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Mic className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}
