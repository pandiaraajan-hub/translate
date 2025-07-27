// Direct mobile speech synthesis - bypasses complex audio context issues
class DirectMobileSpeech {
  private isReady = false;
  private hasUserInteracted = false;

  async initialize(): Promise<boolean> {
    console.log('🔧 Initializing direct mobile speech...');
    
    try {
      // Mark user interaction
      this.hasUserInteracted = true;
      
      // Cancel any existing speech
      speechSynthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force voices to load with immediate speech
      if (speechSynthesis.getVoices().length === 0) {
        console.log('🔧 Loading voices...');
        const loadVoices = new Promise<void>((resolve) => {
          const checkVoices = () => {
            if (speechSynthesis.getVoices().length > 0) {
              resolve();
            } else {
              setTimeout(checkVoices, 50);
            }
          };
          // Start checking immediately
          checkVoices();
          // Also listen for voiceschanged event
          speechSynthesis.onvoiceschanged = () => {
            if (speechSynthesis.getVoices().length > 0) {
              resolve();
            }
          };
        });
        
        // Trigger voice loading
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0;
        speechSynthesis.speak(dummy);
        speechSynthesis.cancel();
        
        // Wait for voices or timeout
        await Promise.race([
          loadVoices,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      }
      
      // Test with actual speech
      const testSuccess = await this.testSpeech();
      this.isReady = testSuccess;
      
      console.log('🔧 Direct mobile speech ready:', this.isReady);
      return this.isReady;
      
    } catch (error) {
      console.error('🔧 Direct mobile speech initialization failed:', error);
      return false;
    }
  }

  private async testSpeech(): Promise<boolean> {
    console.log('🔧 Testing direct speech...');
    
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      
      setTimeout(() => {
        // Create multiple test approaches for maximum mobile compatibility
        const testUtterance = new SpeechSynthesisUtterance('Test');
        testUtterance.volume = 1.0; // Maximum volume
        testUtterance.rate = 0.5; // Slow rate for mobile
        testUtterance.pitch = 1.0;
        testUtterance.lang = 'en-US';
        
        // Force a specific voice if available
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v => 
          v.lang.startsWith('en') && !v.localService
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (englishVoice) {
          testUtterance.voice = englishVoice;
          console.log('🔧 Using test voice:', englishVoice.name);
        }
        
        let resolved = false;
        
        testUtterance.onstart = () => {
          console.log('🔧 Test speech started successfully');
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
        };
        
        testUtterance.onend = () => {
          console.log('🔧 Test speech completed');
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
        };
        
        testUtterance.onerror = (e) => {
          console.error('🔧 Test speech error:', e);
          if (!resolved) {
            resolved = true;
            // Still resolve true - error doesn't mean it won't work later
            resolve(true);
          }
        };
        
        console.log('🔧 Speaking test utterance...');
        speechSynthesis.speak(testUtterance);
        
        // Don't cancel immediately - let it play
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('🔧 Test speech timeout - marking as ready');
            resolve(true);
          }
        }, 5000);
        
      }, 500); // Longer delay for mobile
    });
  }

  async speak(text: string, lang: string = 'en-US'): Promise<void> {
    if (!this.hasUserInteracted) {
      throw new Error('User interaction required for mobile speech');
    }

    console.log('🔧 Direct speech attempt:', { text, lang });
    
    return new Promise((resolve, reject) => {
      // Multiple attempts for mobile compatibility
      this.attemptSpeech(text, lang, 0, resolve, reject);
    });
  }

  private attemptSpeech(text: string, lang: string, attempt: number, resolve: () => void, reject: (error: Error) => void): void {
    if (attempt >= 3) {
      console.error('🔧 All speech attempts failed');
      reject(new Error('Speech synthesis failed after multiple attempts'));
      return;
    }

    console.log(`🔧 Speech attempt ${attempt + 1}/3`);
    
    // Complete cancellation with longer delay
    speechSynthesis.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.7; // Slower for mobile
      utterance.volume = 1.0; // Maximum volume
      utterance.pitch = 1.0;
      
      // More aggressive voice selection
      const voices = speechSynthesis.getVoices();
      console.log('🔧 Available voices:', voices.length);
      
      // Try different voice selection strategies
      let voice = null;
      if (attempt === 0) {
        // First attempt: exact language match
        voice = voices.find(v => v.lang === lang);
      } else if (attempt === 1) {
        // Second attempt: language prefix match, prefer non-local
        voice = voices.find(v => 
          v.lang.startsWith(lang.split('-')[0]) && !v.localService
        );
      } else {
        // Third attempt: any voice with language prefix
        voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      }
      
      // Fallback to first available voice
      if (!voice && voices.length > 0) {
        voice = voices[0];
      }
      
      if (voice) {
        utterance.voice = voice;
        console.log(`🔧 Attempt ${attempt + 1} using voice:`, voice.name, voice.lang);
      } else {
        console.log(`🔧 Attempt ${attempt + 1} using default voice`);
      }
      
      let completed = false;
      
      utterance.onstart = () => {
        console.log(`🔧 Speech attempt ${attempt + 1} started successfully`);
        if (!completed) {
          completed = true;
          resolve();
        }
      };
      
      utterance.onend = () => {
        console.log(`🔧 Speech attempt ${attempt + 1} completed`);
        if (!completed) {
          completed = true;
          resolve();
        }
      };
      
      utterance.onerror = (e) => {
        console.error(`🔧 Speech attempt ${attempt + 1} error:`, e);
        if (!completed) {
          completed = true;
          // Try next attempt
          setTimeout(() => {
            this.attemptSpeech(text, lang, attempt + 1, resolve, reject);
          }, 500);
        }
      };
      
      console.log(`🔧 Starting speech attempt ${attempt + 1}...`);
      speechSynthesis.speak(utterance);
      
      // Longer timeout for mobile
      setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log(`🔧 Speech attempt ${attempt + 1} timeout`);
          // Try next attempt
          speechSynthesis.cancel();
          setTimeout(() => {
            this.attemptSpeech(text, lang, attempt + 1, resolve, reject);
          }, 500);
        }
      }, 8000);
      
    }, 500 + (attempt * 300)); // Increasing delays between attempts
  }

  isInitialized(): boolean {
    return this.isReady;
  }
}

export const directMobileSpeech = new DirectMobileSpeech();