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
    
    // Initialize speech recognition if available - no pre-configuration for iPhone compatibility
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('🎤 iPhone Speech recognition available, will initialize on demand');
    } else {
      console.log('🎤 iPhone Speech recognition not available');
    }
  }

  isRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  async startRecognition(
    language: LanguageCode,
    onResult: (result: SpeechResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    console.log('🎤 iPhone SpeechUtils.startRecognition called with language:', language);
    
    // Create fresh recognition instance for iPhone compatibility
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.error('🎤 iPhone Speech recognition not supported');
      onError('Speech recognition is not supported in this browser on iPhone');
      return;
    }
    
    // Always create a new recognition instance for iPhone reliability
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.log('🎤 iPhone Error stopping old recognition:', e);
      }
    }
    
    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    console.log('🎤 iPhone Created fresh recognition instance');

    // Skip microphone check on iPhone after first successful use to avoid blocking subsequent attempts
    const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const hasUsedMicBefore = localStorage.getItem('iphone_mic_granted') === 'true';
    
    if (!hasUsedMicBefore && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 iPhone Microphone permission granted for first time');
        stream.getTracks().forEach(track => track.stop());
        if (isIPhone) {
          localStorage.setItem('iphone_mic_granted', 'true');
        }
      } catch (permError) {
        console.error('🎤 iPhone Microphone permission denied:', permError);
        onError('Microphone access required. Please allow microphone access and try again. On iPhone: Settings > Safari > Camera & Microphone > Allow');
        return;
      }
    } else {
      console.log('🎤 iPhone Skipping microphone check - previously granted or unavailable');
    }

    // Force stop any existing recognition and reset state for iPhone
    this.isRecognitionActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition.onstart = null;
        this.recognition.onend = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
      } catch (e) {
        console.log('🎤 iPhone Error cleaning old recognition:', e);
      }
      this.recognition = null;
    }
    
    // Wait for complete cleanup before creating new instance
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('🎤 iPhone Recognition state fully reset');

    // Create the new recognition instance after cleanup
    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    
    const langConfig = SUPPORTED_LANGUAGES[language];
    this.recognition.lang = langConfig.code;
    console.log('🎤 iPhone Recognition configured with language:', langConfig.code);

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isRecognitionActive = true;
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isRecognitionActive = false;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 Speech recognition result received');
      const result = event.results[0];
      if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        console.log('🎤 Final transcript:', transcript);
        this.isRecognitionActive = false;
        
        if (transcript) {
          onResult({
            transcript: transcript,
            confidence: result[0].confidence || 0.9
          });
        } else {
          onError('No speech detected');
        }
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
        case 'service-not-allowed':
          errorMessage = 'iPhone microphone blocked. Settings > Safari > Camera & Microphone > Allow, then refresh page.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'aborted':
          console.log('🎤 iPhone Recognition aborted');
          return; // Don't show error for these cases
        case 'already-started':
          console.log('🎤 iPhone Recognition already started error');
          return;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      onError(errorMessage);
    };

    try {
      console.log('🎤 iPhone Starting fresh recognition with language:', this.recognition.lang);
      // iPhone-specific: ensure clean start
      await new Promise(resolve => setTimeout(resolve, 100));
      this.recognition.start();
      console.log('🎤 iPhone Recognition start command issued');
    } catch (error) {
      console.error('🎤 iPhone Failed to start recognition:', error);
      this.isRecognitionActive = false;
      onError(`iPhone speech recognition failed: ${error}`);
    }
  }

  stopRecognition(): void {
    console.log('🎤 iPhone stopRecognition called, active:', this.isRecognitionActive);
    if (this.recognition) {
      try {
        if (this.isRecognitionActive) {
          console.log('🎤 iPhone Stopping active recognition');
          this.recognition.stop();
        }
        this.isRecognitionActive = false;
        // Force reset recognition state
        setTimeout(() => {
          this.isRecognitionActive = false;
          console.log('🎤 iPhone Recognition state force reset');
        }, 100);
      } catch (error) {
        console.log('🎤 iPhone Error stopping recognition:', error);
        this.isRecognitionActive = false;
      }
    }
  }

  async speak(options: SpeechSynthesisOptions): Promise<void> {
    console.log('🔊 Speech synthesis requested:', { text: options.text, lang: options.lang });
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSamsung = /samsung/i.test(navigator.userAgent) || /SM-/i.test(navigator.userAgent);
    console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
    console.log('📱 Samsung device:', isSamsung);
    console.log('📱 User agent:', navigator.userAgent);
    
    if (!this.isSynthesisSupported()) {
      const error = 'Speech synthesis is not supported in this browser';
      console.error('❌', error);
      throw new Error(error);
    }

    // Mobile-specific initialization with Samsung fixes
    if (isMobile) {
      console.log('📱 Mobile device detected - applying mobile audio policies');
      
      // Samsung-specific fixes
      if (isSamsung) {
        console.log('📱 Samsung device detected - applying Samsung-specific fixes');
        
        // Samsung requires longer delays and multiple initialization attempts
        this.synthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Multiple voice initialization attempts for Samsung
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`📱 Samsung voice init attempt ${attempt + 1}`);
            const initUtterance = new SpeechSynthesisUtterance(' ');
            initUtterance.volume = 0.01; // Very quiet but not silent
            initUtterance.rate = 1.0;
            initUtterance.pitch = 1.0;
            this.synthesis.speak(initUtterance);
            await new Promise(resolve => setTimeout(resolve, 200));
            this.synthesis.cancel();
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.warn(`📱 Samsung init attempt ${attempt + 1} failed:`, error);
          }
        }
      } else {
        // Standard mobile initialization
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
      utterance.rate = isMobile ? Math.min(options.rate || 0.7, 0.8) : (options.rate || 0.7);
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

      // Mobile-specific event handlers with Samsung enhancements
      if (isMobile) {
        if (isSamsung) {
          // Samsung-specific event handlers
          utterance.onstart = () => {
            console.log('📱 Samsung speech synthesis started successfully');
          };
          
          utterance.onend = () => {
            console.log('📱 Samsung speech synthesis completed successfully');
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.error('📱 Samsung speech synthesis error:', event);
            console.error('📱 Samsung error details:', {
              error: event.error,
              type: event.type,
              target: event.target
            });
            
            // Samsung-specific error recovery
            if (event.error === 'not-allowed' || event.error === 'audio-busy' || event.error === 'network') {
              console.log('📱 Attempting Samsung-specific audio recovery...');
              setTimeout(() => {
                try {
                  // Create new utterance for Samsung retry
                  const retryUtterance = new SpeechSynthesisUtterance(options.text);
                  retryUtterance.lang = options.lang;
                  retryUtterance.rate = Math.min(options.rate || 0.7, 0.8); // Slower for Samsung
                  retryUtterance.pitch = options.pitch || 1.0;
                  retryUtterance.volume = 1.0;
                  
                  // Find Samsung-compatible voice
                  const voice = this.getBestVoiceForLanguage(options.lang);
                  if (voice) retryUtterance.voice = voice;
                  
                  retryUtterance.onend = () => resolve();
                  retryUtterance.onerror = () => reject(new Error(`Samsung speech failed: ${event.error}`));
                  
                  this.synthesis.speak(retryUtterance);
                  console.log('📱 Samsung recovery attempt made');
                } catch (recoveryError) {
                  console.error('📱 Samsung recovery failed:', recoveryError);
                  reject(new Error(`Samsung speech failed: ${event.error}`));
                }
              }, 800); // Longer delay for Samsung
            } else {
              reject(new Error(`Samsung speech failed: ${event.error || 'Unknown Samsung error'}`));
            }
          };
        } else {
          // Standard mobile event handlers
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
        }
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

      // Start speaking with Samsung-specific handling
      console.log('🚀 Starting speech synthesis...');
      try {
        if (isMobile) {
          if (isSamsung) {
            console.log('📱 Queuing Samsung speech with enhanced handling');
            // Samsung needs longer delay and specific handling
            setTimeout(() => {
              try {
                // Ensure synthesis is ready for Samsung
                if (this.synthesis.paused) {
                  this.synthesis.resume();
                }
                this.synthesis.speak(utterance);
                console.log('📱 Samsung speech queued after extended delay');
              } catch (samsungError) {
                console.error('📱 Samsung speech queue error:', samsungError);
                reject(new Error(`Samsung speech queue failed: ${samsungError}`));
              }
            }, 200); // Extended delay for Samsung
          } else {
            console.log('📱 Queuing mobile speech with enhanced handling');
            // Add small delay for mobile audio context
            setTimeout(() => {
              this.synthesis.speak(utterance);
              console.log('📱 Mobile speech queued after delay');
            }, 100);
          }
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
    console.log('🔍 Searching for MALE voice for:', languageCode);
    console.log('🎤 All available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
    
    // Helper function to check if a voice is likely male
    const isMaleVoice = (voice: SpeechSynthesisVoice): boolean => {
      const name = voice.name.toLowerCase();
      const maleKeywords = ['male', 'man', 'ravi', 'prabhat', 'amit', 'raj', 'suresh', 'kumar', 'david', 'mark', 'john', 'alex'];
      const femaleKeywords = ['female', 'woman', 'priya', 'kavya', 'sunita', 'meera', 'sara', 'emma', 'alice', 'susan'];
      
      // Check for explicit male indicators
      if (maleKeywords.some(keyword => name.includes(keyword))) return true;
      
      // Check for explicit female indicators
      if (femaleKeywords.some(keyword => name.includes(keyword))) return false;
      
      // Default assumption: if no clear indicator, prefer it (many male voices don't specify)
      return true;
    };

    // For ALL languages, prioritize male voices
    let candidateVoices: SpeechSynthesisVoice[] = [];

    // For Tamil, try Tamil first, then Hindi male
    if (languageCode === 'ta-IN') {
      candidateVoices = voices.filter(v => v.lang === 'ta-IN' || v.lang === 'ta');
      if (candidateVoices.length === 0) {
        console.log('⚠️ No Tamil voice found, using Hindi male voice');
        candidateVoices = voices.filter(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      }
    } else if (languageCode === 'hi-IN') {
      // For Hindi, find Hindi voices
      candidateVoices = voices.filter(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
    } else if (languageCode === 'bn-IN') {
      // For Bengali, find Bengali voices, fallback to Hindi
      candidateVoices = voices.filter(v => v.lang === 'bn-IN' || v.lang.startsWith('bn'));
      if (candidateVoices.length === 0) {
        console.log('⚠️ No Bengali voice found, using Hindi male voice');
        candidateVoices = voices.filter(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      }
    } else if (languageCode === 'es-ES') {
      // For Spanish, find Spanish voices
      candidateVoices = voices.filter(v => v.lang === 'es-ES' || v.lang.startsWith('es'));
    } else if (languageCode === 'ar-SA') {
      // For Arabic, find Arabic voices
      candidateVoices = voices.filter(v => v.lang === 'ar-SA' || v.lang.startsWith('ar'));
    } else {
      // For other languages, find exact matches first
      candidateVoices = voices.filter(v => v.lang === languageCode);
      
      if (candidateVoices.length === 0) {
        const langPrefix = languageCode.split('-')[0];
        candidateVoices = voices.filter(v => v.lang.startsWith(langPrefix));
      }
      
      // Fallback alternatives
      if (candidateVoices.length === 0) {
        const alternatives = {
          'zh-CN': ['zh-CN', 'zh', 'cmn-CN', 'zh-Hans'],
          'en-US': ['en-US', 'en', 'en-GB'],
          'ms-MY': ['ms-MY', 'ms', 'en-US', 'en'],
          'hi-IN': ['hi-IN', 'hi', 'en-US', 'en'],
          'bn-IN': ['bn-IN', 'bn', 'hi-IN', 'hi', 'en-US', 'en'],
          'es-ES': ['es-ES', 'es', 'es-MX', 'en-US', 'en'],
          'ar-SA': ['ar-SA', 'ar', 'ar-EG', 'en-US', 'en']
        };
        
        const alts = alternatives[languageCode as keyof typeof alternatives] || [];
        for (const alt of alts) {
          candidateVoices = voices.filter(v => v.lang === alt || v.lang.startsWith(alt.split('-')[0]));
          if (candidateVoices.length > 0) break;
        }
      }
    }

    // From candidate voices, prefer male voices
    const maleVoices = candidateVoices.filter(isMaleVoice);
    const selectedVoice = maleVoices.length > 0 ? maleVoices[0] : candidateVoices[0];

    if (selectedVoice) {
      console.log('✅ Selected voice:', selectedVoice.name, 'for', languageCode, 
                  '(Male:', isMaleVoice(selectedVoice) ? 'Yes' : 'No', ')');
    } else {
      console.log('❌ No voice found for:', languageCode);
    }

    return selectedVoice || null;
  }
}

export const speechUtils = new SpeechUtils();

// Add mobile-specific debugging
if (typeof window !== 'undefined') {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log('🎤 Speech utils initialized - Mobile device:', isMobile);
  console.log('🎤 Speech recognition supported:', speechUtils.isRecognitionSupported());
  console.log('🎤 Speech synthesis supported:', speechUtils.isSynthesisSupported());
  console.log('🎤 User agent:', navigator.userAgent);
}
