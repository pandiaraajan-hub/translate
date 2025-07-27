import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';
import { speechUtils } from '@/lib/speech-utils';
import { Volume2, ArrowDown } from 'lucide-react';

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
    if (!text.trim()) return;

    try {
      await speechUtils.speak({
        text,
        lang: languageCode,
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Voice-Only Translation Results */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Voice Translation</h3>
            
            {/* Source Language Play Button */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`language-flag ${getFlagColors(sourceLanguage)} text-2xl`}>
                  {sourceConfig.flag}
                </div>
                <span className="font-medium text-gray-700">{sourceConfig.name}</span>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="w-16 h-16 rounded-full border-2 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleSpeak(sourceText, sourceConfig.code)}
                disabled={!sourceText.trim()}
              >
                <Volume2 className="h-6 w-6 text-blue-600" />
              </Button>
              <p className="text-sm text-gray-500">
                {sourceText.trim() ? 'Play original' : 'No speech recorded'}
              </p>
            </div>

            {/* Translation Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="h-6 w-6 text-gray-400" />
            </div>

            {/* Target Language Play Button */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-3">
                <div className={`language-flag ${getFlagColors(targetLanguage)} text-2xl`}>
                  {targetConfig.flag}
                </div>
                <span className="font-medium text-gray-700">{targetConfig.name}</span>
              </div>
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
                onClick={() => handleSpeak(translatedText, targetConfig.code)}
                disabled={!translatedText.trim()}
              >
                <Volume2 className="h-6 w-6" />
              </Button>
              <p className="text-sm text-gray-500">
                {translatedText.trim() ? 'Play translation' : 'No translation available'}
              </p>
            </div>

            {/* Status Indicators */}
            {confidence && (
              <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                Speech confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}