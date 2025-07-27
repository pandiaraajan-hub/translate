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
    console.log('📱 User agent:', navigator.userAgent);
    console.log('📱 Is mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    if (!this.isSynthesisSupported()) {
      const error = 'Speech synthesis is not supported in this browser';
      console.error('❌', error);
      throw new Error(error);
    }

    // Mobile browsers need user interaction - ensure we're in a user gesture context
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('📱 Mobile device detected, using mobile-optimized speech synthesis');
      
      // For mobile, cancel any existing speech first
      if (this.synthesis.speaking || this.synthesis.pending) {
        console.log('📱 Cancelling existing speech for mobile');
        this.synthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Force voice loading on mobile
      const voices = this.synthesis.getVoices();
      if (voices.length === 0) {
        console.log('📱 No voices loaded, triggering voice loading...');
        // Trigger voice loading by creating a dummy utterance
        const dummyUtterance = new SpeechSynthesisUtterance('');
        this.synthesis.speak(dummyUtterance);
        this.synthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      // Desktop behavior - wait for completion
      if (this.synthesis.speaking) {
        console.log('🛑 Speech already in progress, waiting...');
        await new Promise(resolve => {
          const checkComplete = () => {
            if (!this.synthesis.speaking) {
              resolve(void 0);
            } else {
              setTimeout(checkComplete, 100);
            }
          };
          checkComplete();
        });
      }
    }

    // Check voices after potential loading
    const voices = this.synthesis.getVoices();
    const availableVoice = this.getBestVoiceForLanguage(options.lang);
    
    console.log('📱 Voices available after check:', voices.length);
    console.log('📱 Selected voice for', options.lang, ':', availableVoice?.name || 'default');
    
    // Handle missing Tamil voice with better mobile support
    if (options.lang === 'ta-IN' && !availableVoice && !isMobile) {
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
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Set basic properties
      utterance.lang = options.lang;
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1.0;

      console.log('📋 Utterance configured:', {
        text: utterance.text,
        lang: utterance.lang,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume
      });

      // Event handlers
      utterance.onstart = () => {
        console.log('▶️ Speech synthesis started');
      };
      
      utterance.onend = () => {
        console.log('✅ Speech synthesis completed');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event);
        if (event.error === 'interrupted') {
          console.log('🔄 Speech was interrupted, creating new utterance and retrying...');
          // Create a completely new utterance for retry
          setTimeout(() => {
            try {
              const retryUtterance = new SpeechSynthesisUtterance(options.text);
              retryUtterance.lang = options.lang;
              retryUtterance.rate = options.rate || 0.9;
              retryUtterance.pitch = options.pitch || 1;
              retryUtterance.volume = options.volume || 1.0;
              
              // Set voice if available
              if (voices.length > 0) {
                const voice = this.getBestVoiceForLanguage(options.lang);
                if (voice) retryUtterance.voice = voice;
              }
              
              retryUtterance.onstart = () => console.log('▶️ Retry speech started');
              retryUtterance.onend = () => {
                console.log('✅ Retry speech completed');
                resolve();
              };
              retryUtterance.onerror = (retryEvent) => {
                console.error('❌ Retry also failed:', retryEvent);
                reject(new Error(`Speech synthesis failed even after retry: ${retryEvent.error}`));
              };
              
              this.synthesis.speak(retryUtterance);
              console.log('🔄 New utterance created and queued for retry');
            } catch (retryError) {
              console.error('❌ Failed to create retry utterance:', retryError);
              reject(new Error(`Speech synthesis failed after retry: ${event.error}`));
            }
          }, 300);
        } else {
          reject(new Error(`Speech synthesis failed: ${event.error || 'Unknown error'}`));
        }
      };

      utterance.onpause = () => console.log('⏸️ Speech paused');
      utterance.onresume = () => console.log('▶️ Speech resumed');

      // Check available voices
      const voices = this.synthesis.getVoices();
      console.log('🎤 Available voices count:', voices.length);
      
      if (voices.length > 0) {
        const voice = this.getBestVoiceForLanguage(options.lang);
        if (voice) {
          console.log('🎯 Selected voice:', voice.name, 'for', options.lang);
          utterance.voice = voice;
        }
      }

      // Mobile-specific settings
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('📱 Applying mobile-specific settings');
        utterance.rate = Math.min(utterance.rate, 1.0); // Slower rate for mobile
        utterance.volume = 1.0; // Full volume for mobile
        
        // Add small delay for mobile browsers
        setTimeout(() => {
          console.log('📱 Mobile speech starting after delay');
          try {
            this.synthesis.speak(utterance);
            console.log('📢 Mobile speech queued successfully');
          } catch (error) {
            console.error('❌ Mobile speech failed:', error);
            reject(new Error(`Mobile speech failed: ${error}`));
          }
        }, 100);
        return; // Exit early for mobile
      }

      // Check if speech synthesis is ready
      if (this.synthesis.paused) {
        console.log('🔄 Resuming paused synthesis');
        this.synthesis.resume();
      }

      // Start speaking immediately
      console.log('🚀 Starting speech synthesis...');
      console.log('🔊 System volume check - synthesis.speaking:', this.synthesis.speaking);
      console.log('🔊 System volume check - synthesis.pending:', this.synthesis.pending);
      console.log('🔊 System volume check - synthesis.paused:', this.synthesis.paused);
      
      try {
        this.synthesis.speak(utterance);
        console.log('📢 Speech queued successfully');
        
        // Add timeout to detect if speech never starts (but don't reject immediately)
        setTimeout(() => {
          if (!this.synthesis.speaking) {
            console.warn('⚠️ Speech may not have started - but continuing...');
            // Don't reject here, let the onend/onerror handle it
          }
        }, 500);
        
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
