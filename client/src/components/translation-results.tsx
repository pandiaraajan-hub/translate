import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@shared/schema';
import { speechUtils } from '@/lib/speech-utils';
import { Volume2, Copy, Edit } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  onSourceTextChange,
}: TranslationResultsProps) {
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [editedSourceText, setEditedSourceText] = useState(sourceText);
  const { toast } = useToast();

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
      toast({
        title: 'Speech Error',
        description: 'Unable to play text-to-speech. Please check your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Text copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Error',
        description: 'Unable to copy text to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleEditSource = () => {
    if (isEditingSource) {
      onSourceTextChange(editedSourceText);
      setIsEditingSource(false);
    } else {
      setEditedSourceText(sourceText);
      setIsEditingSource(true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 sm:grid sm:grid-cols-2 sm:gap-6">
      {/* Source Text */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <div className={`language-flag mr-2 ${getFlagColors(sourceLanguage)}`}>
                {sourceConfig.flag}
              </div>
              {sourceConfig.name} (Source)
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-500 hover:text-primary"
                onClick={() => handleSpeak(sourceText, sourceConfig.code)}
                disabled={!sourceText.trim()}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {isEditingSource ? (
              <Textarea
                value={editedSourceText}
                onChange={(e) => setEditedSourceText(e.target.value)}
                className="h-32 resize-none"
                placeholder="Enter text to translate..."
              />
            ) : (
              <Textarea
                value={sourceText}
                className="h-32 resize-none"
                placeholder="Recognized speech will appear here..."
                readOnly
              />
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {confidence && `Confidence: ${Math.round(confidence * 100)}%`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-blue-700 h-auto p-1"
                onClick={handleEditSource}
              >
                <Edit className="h-3 w-3 mr-1" />
                {isEditingSource ? 'Save' : 'Edit'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Text */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <div className={`language-flag mr-2 ${getFlagColors(targetLanguage)}`}>
                {targetConfig.flag}
              </div>
              {targetConfig.name} (Target)
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-500 hover:text-primary"
                onClick={() => handleSpeak(translatedText, targetConfig.code)}
                disabled={!translatedText.trim()}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <Textarea
              value={translatedText}
              className="h-32 resize-none"
              placeholder="Translation will appear here..."
              readOnly
            />
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Powered by Google Translate</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-blue-700 h-auto p-1"
                onClick={() => handleCopy(translatedText)}
                disabled={!translatedText.trim()}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
