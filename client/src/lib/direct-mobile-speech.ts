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
        const testUtterance = new SpeechSynthesisUtterance('Ready');
        testUtterance.volume = 0.7;
        testUtterance.rate = 1.2;
        testUtterance.pitch = 1.0;
        
        let resolved = false;
        
        testUtterance.onstart = () => {
          console.log('🔧 Test speech started');
          if (!resolved) {
            resolved = true;
            // Cancel immediately to avoid disturbing user
            setTimeout(() => speechSynthesis.cancel(), 100);
            resolve(true);
          }
        };
        
        testUtterance.onend = () => {
          console.log('🔧 Test speech ended');
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
        };
        
        testUtterance.onerror = (e) => {
          console.error('🔧 Test speech error:', e);
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        };
        
        speechSynthesis.speak(testUtterance);
        
        // Fallback timeout
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            speechSynthesis.cancel();
            console.log('🔧 Test speech timeout - assuming success');
            resolve(true);
          }
        }, 3000);
        
      }, 200);
    });
  }

  async speak(text: string, lang: string = 'en-US'): Promise<void> {
    if (!this.hasUserInteracted) {
      throw new Error('User interaction required for mobile speech');
    }

    console.log('🔧 Direct speech:', { text, lang });
    
    return new Promise((resolve, reject) => {
      // Complete cancellation
      speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        
        // Find voice
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => 
          v.lang === lang || 
          v.lang.startsWith(lang.split('-')[0]) ||
          (lang.startsWith('en') && v.lang.startsWith('en'))
        );
        
        if (voice) {
          utterance.voice = voice;
          console.log('🔧 Using voice:', voice.name);
        }
        
        let completed = false;
        
        utterance.onstart = () => {
          console.log('🔧 Speech started');
        };
        
        utterance.onend = () => {
          if (!completed) {
            completed = true;
            console.log('🔧 Speech completed');
            resolve();
          }
        };
        
        utterance.onerror = (e) => {
          if (!completed) {
            completed = true;
            console.error('🔧 Speech error:', e);
            reject(new Error(`Speech failed: ${e.error}`));
          }
        };
        
        console.log('🔧 Starting speech...');
        speechSynthesis.speak(utterance);
        
        // Timeout fallback
        setTimeout(() => {
          if (!completed) {
            completed = true;
            console.log('🔧 Speech timeout');
            resolve(); // Don't reject on timeout, just resolve
          }
        }, 10000);
        
      }, 250);
    });
  }

  isInitialized(): boolean {
    return this.isReady;
  }
}

export const directMobileSpeech = new DirectMobileSpeech();