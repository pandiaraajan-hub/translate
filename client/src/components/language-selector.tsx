import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';
import { ArrowUpDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onSourceLanguageChange: (language: LanguageCode) => void;
  onTargetLanguageChange: (language: LanguageCode) => void;
  onSwapLanguages: () => void;
}

const LanguageButton = ({
  language,
  isSelected,
  onClick,
}: {
  language: LanguageCode;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const config = SUPPORTED_LANGUAGES[language];
  
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

  return (
    <Button
      variant="outline"
      className={`w-full justify-start p-3 h-auto ${
        isSelected
          ? 'border-2 border-primary bg-primary/5 text-primary font-medium'
          : 'border border-gray-200 hover:border-gray-300 text-gray-700'
      }`}
      onClick={onClick}
    >
      <div className={`language-flag mr-2 ${getFlagColors(language)}`}>
        {config.flag}
      </div>
      {config.name}
      {isSelected && <Check className="ml-auto h-4 w-4" />}
    </Button>
  );
};

export function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
}: LanguageSelectorProps) {
  const languages = Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Languages</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {/* Source Language */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">From</label>
            <div className="space-y-2">
              {languages.map((language) => (
                <LanguageButton
                  key={`source-${language}`}
                  language={language}
                  isSelected={sourceLanguage === language}
                  onClick={() => onSourceLanguageChange(language)}
                />
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-gray-100 hover:bg-gray-200 ripple"
              onClick={onSwapLanguages}
            >
              <ArrowUpDown className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Target Language */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">To</label>
            <div className="space-y-2">
              {languages.map((language) => (
                <LanguageButton
                  key={`target-${language}`}
                  language={language}
                  isSelected={targetLanguage === language}
                  onClick={() => onTargetLanguageChange(language)}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
