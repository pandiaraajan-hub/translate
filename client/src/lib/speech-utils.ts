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
  private isRecognitionActive: boolean = false;

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

    // Prevent starting if already active
    if (this.isRecognitionActive) {
      console.log('Speech recognition already active, skipping start');
      return;
    }

    const langConfig = SUPPORTED_LANGUAGES[language];
    this.recognition.lang = langConfig.code;

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isRecognitionActive = true;
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isRecognitionActive = false;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result.isFinal) {
        this.isRecognitionActive = false;
        onResult({
          transcript: result[0].transcript,
          confidence: result[0].confidence || 0
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isRecognitionActive = false;
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
        case 'already-started':
          return; // Don't show error for these cases
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.isRecognitionActive = false;
      console.error('Failed to start recognition:', error);
      onError('Failed to start speech recognition');
    }
  }

  stopRecognition(): void {
    if (this.recognition && this.isRecognitionActive) {
      console.log('Stopping speech recognition');
      this.recognition.stop();
      this.isRecognitionActive = false;
    }
  }

  async speak(options: SpeechSynthesisOptions): Promise<void> {
    console.log('🔊 Speech synthesis requested:', { text: options.text, lang: options.lang });
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    if (!this.isSynthesisSupported()) {
      const error = 'Speech synthesis is not supported in this browser';
      console.error('❌', error);
      throw new Error(error);
    }

    // Cancel any existing speech
    if (this.synthesis.speaking || this.synthesis.pending) {
      console.log('🛑 Cancelling existing speech');
      this.synthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, isMobile ? 300 : 100));
    }

    // Force voice loading if needed
    const voices = this.synthesis.getVoices();
    if (voices.length === 0) {
      console.log('📱 No voices loaded, triggering voice loading...');
      const dummyUtterance = new SpeechSynthesisUtterance('');
      this.synthesis.speak(dummyUtterance);
      this.synthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const updatedVoices = this.synthesis.getVoices();
    console.log('🎤 Available voices:', updatedVoices.length);
    
    // Handle missing Tamil voice
    if (options.lang === 'ta-IN' && !this.getBestVoiceForLanguage(options.lang) && !isMobile) {
      console.log('⚠️ No Tamil voice available on desktop, providing English notification');
      const notification = new SpeechSynthesisUtterance('Tamil voice not available on this device');
      notification.lang = 'en-US';
      notification.rate = 1.0;
      notification.volume = 1.0;
      
      return new Promise((resolve) => {
        notification.onend = () => resolve();
        notification.onerror = () => resolve();
        this.synthesis.speak(notification);
      });
    }
    
    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.lang = options.lang;
      utterance.rate = isMobile ? Math.min(options.rate || 0.9, 1.0) : (options.rate || 0.9);
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = 1.0; // Always full volume

      console.log('📋 Utterance configured:', {
        text: utterance.text,
        lang: utterance.lang,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
        isMobile
      });

      utterance.onstart = () => {
        console.log('▶️ Speech synthesis started');
      };
      
      utterance.onend = () => {
        console.log('✅ Speech synthesis completed');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event);
        reject(new Error(`Speech synthesis failed: ${event.error || 'Unknown error'}`));
      };

      // Set voice if available
      const voice = this.getBestVoiceForLanguage(options.lang);
      if (voice) {
        console.log('🎯 Selected voice:', voice.name, 'for', options.lang);
        utterance.voice = voice;
      }

      // Check if speech synthesis is ready
      if (this.synthesis.paused) {
        console.log('🔄 Resuming paused synthesis');
        this.synthesis.resume();
      }

      // Start speaking
      console.log('🚀 Starting speech synthesis...');
      try {
        this.synthesis.speak(utterance);
        console.log('📢 Speech queued successfully');
      } catch (error) {
        console.error('❌ Failed to queue speech:', error);
        reject(new Error(`Failed to start speech: ${error}`));
      }
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
    console.log('🔍 Searching for voice for:', languageCode);
    
    // Check if any Tamil voices exist
    const tamilVoices = voices.filter(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
    console.log('🇮🇳 Tamil voices found:', tamilVoices.map(v => ({ name: v.name, lang: v.lang })));
    
    // For Tamil, if no Tamil voice exists, use Hindi as fallback (similar pronunciation)
    if (languageCode === 'ta-IN') {
      let voice = voices.find(v => v.lang === 'ta-IN' || v.lang === 'ta');
      if (!voice) {
        console.log('⚠️ No Tamil voice found, trying Hindi as fallback');
        voice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
        if (voice) {
          console.log('🔄 Using Hindi voice for Tamil:', voice.name);
          return voice;
        }
      }
      if (voice) {
        console.log('✅ Found Tamil voice:', voice.name);
        return voice;
      }
    }
    
    // Try to find an exact match
    let voice = voices.find(v => v.lang === languageCode);
    console.log('Exact match for', languageCode, ':', voice?.name);
    
    // If no exact match, try to find a voice with the same language prefix
    if (!voice) {
      const langPrefix = languageCode.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langPrefix));
      console.log('Prefix match for', langPrefix, ':', voice?.name);
    }
    
    // If still no match, try some common alternatives
    if (!voice) {
      const alternatives = {
        'zh-CN': ['zh-CN', 'zh', 'cmn-CN', 'zh-Hans'],
        'en-US': ['en-US', 'en', 'en-GB'],
        'ta-IN': ['ta-IN', 'ta', 'hi-IN', 'hi'] // Hindi as fallback for Tamil
      };
      
      const alts = alternatives[languageCode as keyof typeof alternatives] || [];
      for (const alt of alts) {
        voice = voices.find(v => v.lang === alt || v.lang.startsWith(alt.split('-')[0]));
        if (voice) {
          console.log('Alternative match for', languageCode, ':', voice.name);
          break;
        }
      }
    }
    
    return voice || null;
  }
}

export const speechUtils = new SpeechUtils();
