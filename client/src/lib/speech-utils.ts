import { SUPPORTED_LANGUAGES, type LanguageCode } from "@shared/schema";

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export interface SpeechSynthesisOptions {
  text: string;
  lang: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export class SpeechUtils {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  async startRecognition(
    language: LanguageCode,
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    const langConfig = SUPPORTED_LANGUAGES[language];
    this.recognition.lang = langConfig.code;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result.isFinal) {
        onResult({
          transcript: result[0].transcript,
          confidence: result[0].confidence || 0
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly into your microphone and try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'aborted':
          return; // Don't show error for user-initiated stops
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
    };

    this.recognition.start();
  }

  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  async speak(options: SpeechSynthesisOptions): Promise<void> {
    if (!this.isSynthesisSupported()) {
      throw new Error('Speech synthesis is not supported in this browser');
    }

    console.log('Speaking text:', options.text, 'in language:', options.lang);

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Wait for voices to be loaded if not already
    const voices = this.synthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      await new Promise(resolve => {
        const checkVoices = () => {
          if (this.synthesis.getVoices().length > 0) {
            resolve(void 0);
          } else {
            setTimeout(checkVoices, 100);
          }
        };
        checkVoices();
      });
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.lang = options.lang;
      utterance.rate = options.rate || 0.85;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1.0;

      // Try to use the best available voice for the language
      const bestVoice = this.getBestVoiceForLanguage(options.lang);
      if (bestVoice) {
        console.log('Using voice:', bestVoice.name, 'for language:', options.lang);
        utterance.voice = bestVoice;
      } else {
        console.log('No specific voice found for language:', options.lang, 'using default');
      }

      utterance.onstart = () => console.log('Speech started');
      utterance.onend = () => {
        console.log('Speech ended');
        resolve();
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Add a small delay to ensure proper cancellation
      setTimeout(() => {
        console.log('Starting speech synthesis...');
        this.synthesis.speak(utterance);
      }, 100);
    });
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  getBestVoiceForLanguage(languageCode: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    
    // Try to find an exact match
    let voice = voices.find(v => v.lang === languageCode);
    
    // If no exact match, try to find a voice with the same language prefix
    if (!voice) {
      const langPrefix = languageCode.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langPrefix));
    }
    
    return voice || null;
  }
}

export const speechUtils = new SpeechUtils();
