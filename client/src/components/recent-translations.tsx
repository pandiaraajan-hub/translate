import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { SUPPORTED_LANGUAGES, type Translation, type LanguageCode } from '@shared/schema';
import { speechUtils } from '@/lib/speech-utils';
import { Play, Trash2, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecentTranslationsProps {
  onSelectTranslation: (translation: Translation) => void;
}

export function RecentTranslations({ onSelectTranslation }: RecentTranslationsProps) {
  const { recentTranslations, isLoadingTranslations, clearHistory, isClearingHistory } = useTranslation();
  const { toast } = useToast();

  const getFlagColors = (lang: string) => {
    switch (lang) {
      case 'zh-CN':
        return 'bg-red-500';
      case 'en-US':
        return 'bg-blue-600';
      case 'ta-IN':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getFlagText = (lang: string) => {
    switch (lang) {
      case 'zh-CN':
        return '中';
      case 'en-US':
        return 'EN';
      case 'ta-IN':
        return 'த';
      default:
        return '?';
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'zh-CN':
        return 'Chinese';
      case 'en-US':
        return 'English';
      case 'ta-IN':
        return 'Tamil';
      default:
        return 'Unknown';
    }
  };

  const handleSpeak = async (text: string, lang: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await speechUtils.speak({ text, lang });
    } catch (error) {
      toast({
        title: 'Speech Error',
        description: 'Unable to play text-to-speech',
        variant: 'destructive',
      });
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    toast({
      title: 'History Cleared',
      description: 'All translation history has been cleared',
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  if (isLoadingTranslations) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Recent Translations</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            onClick={handleClearHistory}
            disabled={isClearingHistory || recentTranslations.length === 0}
          >
            {isClearingHistory ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              'Clear All'
            )}
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentTranslations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent translations</p>
              <p className="text-sm">Start recording to see your translation history</p>
            </div>
          ) : (
            recentTranslations.map((translation) => (
              <div
                key={translation.id}
                className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => onSelectTranslation(translation)}
              >
                <div className="flex flex-col space-y-1 items-center">
                  <div className={`language-flag ${getFlagColors(translation.sourceLanguage)}`}>
                    {getFlagText(translation.sourceLanguage)}
                  </div>
                  <ArrowDown className="text-gray-400 h-3 w-3" />
                  <div className={`language-flag ${getFlagColors(translation.targetLanguage)}`}>
                    {getFlagText(translation.targetLanguage)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {getLanguageName(translation.sourceLanguage)} → {getLanguageName(translation.targetLanguage)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(new Date(translation.createdAt))}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 text-gray-400 hover:text-primary flex-shrink-0"
                  onClick={(e) => handleSpeak(translation.translatedText, translation.targetLanguage, e)}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
