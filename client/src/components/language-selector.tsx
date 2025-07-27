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
      className={`w-full justify-start p-3 sm:p-3 h-auto min-h-[48px] text-sm sm:text-base ${
        isSelected
          ? 'border-2 border-primary bg-primary/5 text-primary font-medium'
          : 'border border-gray-200 hover:border-gray-300 text-gray-700 active:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className={`language-flag mr-2 sm:mr-2 ${getFlagColors(language)}`}>
        {config.flag}
      </div>
      <span className="flex-1 text-left">{config.name}</span>
      {isSelected && <Check className="ml-auto h-4 w-4 flex-shrink-0" />}
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
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Select Languages</h2>
        
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
          {/* Source Language */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-sm font-medium text-gray-700">From</label>
            <div className="grid grid-cols-1 gap-2">
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
          <div className="flex items-center justify-center order-last sm:order-none">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-gray-100 hover:bg-gray-200 ripple h-12 w-12 sm:h-10 sm:w-10"
              onClick={onSwapLanguages}
            >
              <ArrowUpDown className="h-5 w-5 sm:h-4 sm:w-4 text-gray-600" />
            </Button>
          </div>

          {/* Target Language */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-sm font-medium text-gray-700">To</label>
            <div className="grid grid-cols-1 gap-2">
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
