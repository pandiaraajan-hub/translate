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
      alert(`Speech error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

            {/* Audio System Check */}
            <div className="flex justify-center gap-2 mt-2">
              <button 
                onClick={() => {
                  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  const voices = speechSynthesis.getVoices();
                  
                  console.log('🔊 System Audio Check:');
                  console.log('- Device type:', isMobile ? 'Mobile' : 'Desktop');
                  console.log('- speechSynthesis available:', 'speechSynthesis' in window);
                  console.log('- speechSynthesis.speaking:', speechSynthesis.speaking);
                  console.log('- speechSynthesis.pending:', speechSynthesis.pending);
                  console.log('- speechSynthesis.paused:', speechSynthesis.paused);
                  console.log('- Available voices:', voices.length);
                  console.log('- Voice names:', voices.map(v => v.name).slice(0, 5));
                  
                  alert(`Audio System Status:
• Device: ${isMobile ? 'Mobile' : 'Desktop'}
• Speech Synthesis: ${'speechSynthesis' in window ? 'Available' : 'Not Available'}
• Currently Speaking: ${speechSynthesis.speaking ? 'Yes' : 'No'}
• Available Voices: ${voices.length}
• User Agent: ${navigator.userAgent.substring(0, 50)}...

${isMobile ? 'Mobile Tips:\n• Tap to ensure user interaction\n• Check device volume\n• Try different browsers' : 'Desktop Tips:\n• Check system volume\n• Try headphones\n• Check browser permissions'}`);
                }}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                🔧 Audio Check
              </button>
            </div>

            {/* Voice Status and Test Buttons */}
            {translatedText.trim() && (
              <div className="space-y-2">
                {/* Voice availability notice */}
                {targetLanguage === 'tamil' && (
                  <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 text-center">
                    Tamil voice may not be available on this device
                  </div>
                )}
                
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => handleSpeak(translatedText, targetConfig.code)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={isPlaying}
                  >
                    {isPlaying ? 'Playing...' : '🔊 Test Audio'}
                  </button>
                <button 
                  onClick={() => {
                    // Test Tamil directly with different approaches
                    console.log('🇮🇳 Testing Tamil speech synthesis directly');
                    
                    // Try 1: Direct Tamil
                    const tamilText = translatedText || 'வணக்கம்';
                    const utterance1 = new SpeechSynthesisUtterance(tamilText);
                    utterance1.lang = 'ta-IN';
                    utterance1.rate = 0.8;
                    utterance1.volume = 1.0;
                    
                    // Try to find any voice that might work
                    const voices = speechSynthesis.getVoices();
                    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi'));
                    const tamilVoice = voices.find(v => v.lang.includes('ta') || v.name.includes('Tamil'));
                    
                    if (tamilVoice) {
                      utterance1.voice = tamilVoice;
                      console.log('🎯 Using Tamil voice:', tamilVoice.name);
                    } else if (hindiVoice) {
                      utterance1.voice = hindiVoice;
                      console.log('🔄 Using Hindi voice for Tamil:', hindiVoice.name);
                    } else {
                      console.log('⚠️ No Tamil or Hindi voice found, using default');
                    }
                    
                    utterance1.onstart = () => console.log('▶️ Tamil test started');
                    utterance1.onend = () => console.log('✅ Tamil test completed');
                    utterance1.onerror = (e) => {
                      console.error('❌ Tamil test failed:', e);
                      // Try fallback with English pronunciation
                      const fallback = new SpeechSynthesisUtterance('Hello');
                      fallback.lang = 'en-US';
                      fallback.onstart = () => console.log('▶️ Fallback English started');
                      fallback.onend = () => console.log('✅ Fallback completed');
                      speechSynthesis.speak(fallback);
                    };
                    
                    speechSynthesis.speak(utterance1);
                    console.log('📢 Tamil test queued');
                  }}
                  className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  🇮🇳 Tamil Test
                </button>
                <button 
                  onClick={() => {
                    // Mobile-optimized speech test
                    console.log('📱 Mobile speech test starting');
                    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    // Cancel any existing speech
                    speechSynthesis.cancel();
                    
                    // Create simple test utterance
                    const testText = isMobile ? 'Mobile test' : 'Desktop test';
                    const utterance = new SpeechSynthesisUtterance(testText);
                    utterance.lang = 'en-US';
                    utterance.rate = isMobile ? 0.8 : 1.0;
                    utterance.volume = 1.0;
                    utterance.pitch = 1.0;
                    
                    utterance.onstart = () => console.log('📱 Mobile test speech started');
                    utterance.onend = () => console.log('📱 Mobile test speech ended');
                    utterance.onerror = (e) => {
                      console.error('📱 Mobile test failed:', e);
                      alert(`Mobile speech test failed: ${e.error || 'Unknown error'}`);
                    };
                    
                    // Immediate speech for mobile
                    speechSynthesis.speak(utterance);
                    console.log('📱 Mobile test queued');
                  }}
                  className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  📱 Mobile Test
                </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}