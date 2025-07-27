import { Card, CardContent } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';
import { speechUtils } from '@/lib/speech-utils';
import { ArrowDown, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TranslationResultsProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  sourceText: string;
  translatedText: string;
  confidence?: number;
  onSourceTextChange: (text: string) => void;
}

export function TranslationResults({
  sourceLanguage,
  targetLanguage,
  sourceText,
  translatedText,
  confidence,
}: TranslationResultsProps) {
  const sourceConfig = SUPPORTED_LANGUAGES[sourceLanguage];
  const targetConfig = SUPPORTED_LANGUAGES[targetLanguage];
  const lastTranslatedText = useRef<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  const getFlagColors = (lang: LanguageCode) => {
    switch (lang) {
      case 'chinese':
        return 'bg-red-500';
      case 'english':
        return 'bg-blue-600';
      case 'tamil':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleSpeak = async (text: string, languageCode: string) => {
    if (!text.trim()) {
      console.log('No text to speak');
      return;
    }

    console.log('handleSpeak called with:', { text, languageCode });

    try {
      setIsPlaying(true);
      
      // Check if speech synthesis is available
      if (!speechUtils.isSynthesisSupported()) {
        console.error('Speech synthesis not supported');
        alert('Speech synthesis is not supported in this browser');
        return;
      }

      console.log('Starting speech synthesis...');
      await speechUtils.speak({
        text,
        lang: languageCode,
      });
      console.log('Speech synthesis completed');
      
    } catch (error) {
      console.error('Speech synthesis error:', error);
      alert(`Speech error: ${error.message}`);
    } finally {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  // Auto-play translation when it's available and new
  useEffect(() => {
    if (translatedText.trim() && 
        translatedText !== sourceText && 
        translatedText !== lastTranslatedText.current) {
      console.log('Auto-playing translation:', translatedText, 'in language:', targetConfig.code);
      lastTranslatedText.current = translatedText;
      // Add a small delay to ensure the UI updates before speaking
      setTimeout(() => {
        handleSpeak(translatedText, targetConfig.code);
      }, 800);
    }
  }, [translatedText, sourceText, targetConfig.code]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Simple Translation Status */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`language-flag ${getFlagColors(sourceLanguage)} text-xl`}>
                  {sourceConfig.flag}
                </div>
                <span className="font-medium text-gray-700">{sourceConfig.name}</span>
              </div>
              
              <ArrowDown className="h-5 w-5 text-gray-400 transform rotate-90" />
              
              <div className="flex items-center space-x-2">
                <div className={`language-flag ${getFlagColors(targetLanguage)} text-xl`}>
                  {targetConfig.flag}
                </div>
                <span className="font-medium text-gray-700">{targetConfig.name}</span>
              </div>
            </div>

            {/* Status Message with Visual Feedback */}
            <div className="flex items-center justify-center space-x-2">
              {isPlaying && (
                <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
              )}
              <p className="text-sm text-gray-500">
                {!sourceText.trim() 
                  ? 'Press and hold to record your voice' 
                  : isPlaying
                    ? 'Playing translation...'
                    : translatedText.trim() 
                      ? 'Translation complete'
                      : 'Translating your speech...'
                }
              </p>
              {!sourceText.trim() && !translatedText.trim() && (
                <div className="animate-bounce">🎤</div>
              )}
            </div>

            {/* Confidence Indicator */}
            {confidence && (
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                Speech confidence: {Math.round(confidence * 100)}%
              </div>
            )}

            {/* Test Audio Button */}
            {translatedText.trim() && (
              <div className="flex justify-center mt-2">
                <button 
                  onClick={() => handleSpeak(translatedText, targetConfig.code)}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={isPlaying}
                >
                  {isPlaying ? 'Playing...' : '🔊 Test Audio'}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}