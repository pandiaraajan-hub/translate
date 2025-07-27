import { SUPPORTED_LANGUAGES, type LanguageCode } from "@shared/schema";

export interface SpeechResult {
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

// Type declarations for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionApiResult;
  [index: number]: SpeechRecognitionApiResult;
}

interface SpeechRecognitionApiResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
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
    onResult: (result: SpeechResult) => void,
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
    console.log('📱 User agent:', navigator.userAgent);
    
    if (!this.isSynthesisSupported()) {
      const error = 'Speech synthesis is not supported in this browser';
      console.error('❌', error);
      throw new Error(error);
    }

    // Mobile-specific initialization
    if (isMobile) {
      console.log('📱 Mobile device detected - applying mobile audio policies');
      
      // Force complete cancellation on mobile
      this.synthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we're in a user gesture context
      console.log('📱 Checking user gesture context...');
      
      // Trigger voice loading with a silent utterance
      console.log('📱 Forcing voice initialization...');
      try {
        const initUtterance = new SpeechSynthesisUtterance('');
        initUtterance.volume = 0; // Silent
        this.synthesis.speak(initUtterance);
        this.synthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.warn('📱 Voice initialization failed:', error);
      }
    } else {
      // Desktop behavior - standard cancellation
      if (this.synthesis.speaking || this.synthesis.pending) {
        console.log('🛑 Cancelling existing speech');
        this.synthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Get available voices
    let voices = this.synthesis.getVoices();
    console.log('🎤 Initial voices:', voices.length);
    
    // On mobile, wait for voices to load if none are available
    if (isMobile && voices.length === 0) {
      console.log('📱 Waiting for voices to load on mobile...');
      await new Promise((resolve) => {
        const checkVoices = () => {
          const currentVoices = this.synthesis.getVoices();
          if (currentVoices.length > 0) {
            console.log('📱 Voices loaded:', currentVoices.length);
            resolve(void 0);
          } else {
            setTimeout(checkVoices, 100);
          }
        };
        checkVoices();
        // Timeout after 2 seconds
        setTimeout(() => resolve(void 0), 2000);
      });
      voices = this.synthesis.getVoices();
    }
    
    console.log('🎤 Final available voices:', voices.length);
    
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

      // Mobile-specific event handlers with enhanced logging
      if (isMobile) {
        utterance.onstart = () => {
          console.log('📱 Mobile speech synthesis started successfully');
        };
        
        utterance.onend = () => {
          console.log('📱 Mobile speech synthesis completed successfully');
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('📱 Mobile speech synthesis error:', event);
          console.error('📱 Error details:', {
            error: event.error,
            type: event.type,
            target: event.target
          });
          
          // Try to recover from common mobile errors
          if (event.error === 'not-allowed' || event.error === 'audio-busy') {
            console.log('📱 Attempting mobile audio recovery...');
            setTimeout(() => {
              try {
                this.synthesis.speak(utterance);
                console.log('📱 Mobile recovery attempt made');
              } catch (recoveryError) {
                console.error('📱 Mobile recovery failed:', recoveryError);
                reject(new Error(`Mobile speech failed: ${event.error}`));
              }
            }, 500);
          } else {
            reject(new Error(`Mobile speech failed: ${event.error || 'Unknown mobile error'}`));
          }
        };
      } else {
        // Desktop event handlers
        utterance.onstart = () => {
          console.log('▶️ Desktop speech synthesis started');
        };
        
        utterance.onend = () => {
          console.log('✅ Desktop speech synthesis completed');
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Desktop speech synthesis error:', event);
          reject(new Error(`Desktop speech failed: ${event.error || 'Unknown error'}`));
        };
      }

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

      // Start speaking with mobile-specific handling
      console.log('🚀 Starting speech synthesis...');
      try {
        if (isMobile) {
          console.log('📱 Queuing mobile speech with enhanced handling');
          // Add small delay for mobile audio context
          setTimeout(() => {
            this.synthesis.speak(utterance);
            console.log('📱 Mobile speech queued after delay');
          }, 100);
        } else {
          this.synthesis.speak(utterance);
          console.log('📢 Desktop speech queued successfully');
        }
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
    
    // For Tamil, if no Tamil voice exists, use Hindi male voice as fallback
    if (languageCode === 'ta-IN') {
      let voice = voices.find(v => v.lang === 'ta-IN' || v.lang === 'ta');
      if (!voice) {
        console.log('⚠️ No Tamil voice found, trying Hindi male voice as fallback');
        // Prefer male Hindi voices for Indian accent
        voice = voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && 
                               (v.name.toLowerCase().includes('male') || 
                                v.name.toLowerCase().includes('man') ||
                                v.name.toLowerCase().includes('ravi') ||
                                v.name.toLowerCase().includes('prabhat'))) ||
               voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
        if (voice) {
          console.log('🔄 Using Hindi male voice for Tamil:', voice.name);
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
        'ta-IN': ['ta-IN', 'ta', 'hi-IN', 'hi'], // Hindi male as fallback for Tamil
        'ms-MY': ['ms-MY', 'ms', 'en-US', 'en'] // English as fallback for Malay
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
