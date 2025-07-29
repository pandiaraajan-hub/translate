import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, Volume2 } from 'lucide-react';
import { type LanguageCode, SUPPORTED_LANGUAGES } from '@shared/schema';

interface CleanTranslationResultsProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;  
  sourceText: string;
  translatedText: string;
  confidence?: number;
  isPlaying: boolean;
  onTestAudio?: () => void;
}

export function CleanTranslationResults({
  sourceLanguage,
  targetLanguage,
  sourceText,
  translatedText,
  confidence,
  isPlaying,
  onTestAudio
}: CleanTranslationResultsProps) {
  console.log('🎯 CleanTranslationResults render:', { sourceText, translatedText });
  
  const sourceConfig = SUPPORTED_LANGUAGES[sourceLanguage];
  const targetConfig = SUPPORTED_LANGUAGES[targetLanguage];

  const getFlagColors = (language: LanguageCode) => {
    const colors: Record<LanguageCode, string> = {
      english: 'text-blue-600',
      tamil: 'text-orange-600',
      chinese: 'text-red-600',
      malay: 'text-green-600',
      hindi: 'text-purple-600',
      bengali: 'text-indigo-600',
      spanish: 'text-yellow-600',
      arabic: 'text-teal-600'
    };
    return colors[language] || 'text-gray-600';
  };

  return (
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
            
            <ArrowDown className="h-5 w-5 text-gray-400 transform -rotate-90" />
            
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

          {/* Translation Results */}
          {sourceText.trim() && (
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  {sourceConfig.name}
                </div>
                <div className="text-sm text-gray-800">{sourceText}</div>
              </div>
              
              {translatedText.trim() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs text-green-600 font-medium mb-1">
                    {targetConfig.name}
                  </div>
                  <div className="text-sm text-gray-800">{translatedText}</div>
                </div>
              )}
            </div>
          )}

          {/* Confidence Indicator */}
          {confidence && confidence > 0 && (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
              Speech confidence: {Math.round(confidence * 100)}%
            </div>
          )}


        </div>
      </CardContent>
    </Card>
  );
}