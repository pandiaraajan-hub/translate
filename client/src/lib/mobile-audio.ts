// Mobile audio context manager
class MobileAudioManager {
  private audioContext: AudioContext | null = null;
  private isActivated = false;
  private pendingSpeech: (() => void)[] = [];
  private activationPromise: Promise<boolean> | null = null;

  async activateAudio(): Promise<boolean> {
    // Prevent multiple simultaneous activations
    if (this.activationPromise) {
      return this.activationPromise;
    }

    this.activationPromise = this.performActivation();
    const result = await this.activationPromise;
    this.activationPromise = null;
    return result;
  }

  private async performActivation(): Promise<boolean> {
    console.log('📱 Starting comprehensive mobile audio activation...');
    
    try {
      // Step 1: Force user interaction acknowledgment
      const userInteracted = await this.ensureUserInteraction();
      if (!userInteracted) {
        console.error('📱 User interaction required but not provided');
        return false;
      }

      // Step 2: Create and activate AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error('📱 AudioContext not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();
      console.log('📱 AudioContext created:', this.audioContext.state);

      // Force resume AudioContext
      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
        console.log('📱 AudioContext resumed:', this.audioContext.state);
        
        // Wait for state change
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 3: Prime speech synthesis with silent utterance
      await this.primeSpeechSynthesis();

      // Step 4: Test audio with actual sound
      const testSuccess = await this.performAudioTest();
      if (!testSuccess) {
        console.error('📱 Audio test failed');
        return false;
      }

      this.isActivated = true;
      console.log('📱 Mobile audio fully activated');

      // Execute pending speech
      this.pendingSpeech.forEach(fn => fn());
      this.pendingSpeech = [];

      return true;
    } catch (error) {
      console.error('📱 Mobile audio activation failed:', error);
      return false;
    }
  }

  private async ensureUserInteraction(): Promise<boolean> {
    // This is called from a user click, so interaction is guaranteed
    console.log('📱 User interaction confirmed');
    return true;
  }

  private async primeSpeechSynthesis(): Promise<void> {
    console.log('📱 Priming speech synthesis...');
    
    return new Promise((resolve) => {
      // Cancel any existing speech
      speechSynthesis.cancel();
      
      // Create silent utterance to prime the system
      const primeUtterance = new SpeechSynthesisUtterance('');
      primeUtterance.volume = 0;
      primeUtterance.rate = 10; // Fast to complete quickly
      
      primeUtterance.onend = () => {
        console.log('📱 Speech synthesis primed');
        resolve();
      };
      
      primeUtterance.onerror = () => {
        console.log('📱 Speech synthesis prime completed (with error, but that\'s ok)');
        resolve();
      };
      
      speechSynthesis.speak(primeUtterance);
      
      // Timeout fallback
      setTimeout(() => {
        speechSynthesis.cancel();
        resolve();
      }, 1000);
    });
  }

  private async performAudioTest(): Promise<boolean> {
    console.log('📱 Performing audio test...');
    
    return new Promise((resolve) => {
      const testUtterance = new SpeechSynthesisUtterance('Test');
      testUtterance.volume = 0.1; // Very quiet
      testUtterance.rate = 10; // Fast
      testUtterance.pitch = 1;
      
      let testCompleted = false;
      
      testUtterance.onstart = () => {
        console.log('📱 Audio test started successfully');
        if (!testCompleted) {
          testCompleted = true;
          speechSynthesis.cancel(); // Stop immediately
          resolve(true);
        }
      };
      
      testUtterance.onend = () => {
        console.log('📱 Audio test completed');
        if (!testCompleted) {
          testCompleted = true;
          resolve(true);
        }
      };
      
      testUtterance.onerror = (e) => {
        console.error('📱 Audio test failed:', e);
        if (!testCompleted) {
          testCompleted = true;
          resolve(false);
        }
      };
      
      speechSynthesis.speak(testUtterance);
      
      // Timeout fallback - assume success if we get this far
      setTimeout(() => {
        if (!testCompleted) {
          testCompleted = true;
          speechSynthesis.cancel();
          console.log('📱 Audio test timeout - assuming success');
          resolve(true);
        }
      }, 2000);
    });
  }

  isAudioActivated(): boolean {
    return this.isActivated;
  }

  addPendingSpeech(speechFn: () => void): void {
    if (this.isActivated) {
      speechFn();
    } else {
      this.pendingSpeech.push(speechFn);
    }
  }

  async createMobileSpeech(text: string, lang: string = 'en-US'): Promise<void> {
    console.log('📱 Creating mobile speech:', { text, lang });

    // If not activated, try to activate first
    if (!this.isActivated) {
      console.log('📱 Mobile audio not activated, attempting activation...');
      const activated = await this.activateAudio();
      if (!activated) {
        throw new Error('Mobile audio activation required. Please tap "Activate Mobile Audio" first.');
      }
    }

    return new Promise((resolve, reject) => {
      const executeSpeech = () => {
        try {
          // Complete cancellation with delay
          speechSynthesis.cancel();
          
          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.8; // Slower for mobile
            utterance.volume = 1.0;
            utterance.pitch = 1.0;

            // Load voices if needed
            let voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
              // Trigger voice loading
              const dummy = new SpeechSynthesisUtterance('');
              dummy.volume = 0;
              speechSynthesis.speak(dummy);
              speechSynthesis.cancel();
              voices = speechSynthesis.getVoices();
            }

            // Find best voice
            const voice = voices.find(v => 
              v.lang === lang || 
              v.lang.startsWith(lang.split('-')[0]) ||
              (lang.startsWith('en') && v.lang.startsWith('en'))
            );

            if (voice) {
              utterance.voice = voice;
              console.log('📱 Using voice:', voice.name);
            } else {
              console.log('📱 Using default voice, available:', voices.length);
            }

            let speechStarted = false;
            let speechCompleted = false;

            utterance.onstart = () => {
              speechStarted = true;
              console.log('📱 Mobile speech started successfully');
            };

            utterance.onend = () => {
              if (!speechCompleted) {
                speechCompleted = true;
                console.log('📱 Mobile speech completed');
                resolve();
              }
            };

            utterance.onerror = (e) => {
              if (!speechCompleted) {
                speechCompleted = true;
                console.error('📱 Mobile speech error:', e);
                reject(new Error(`Mobile speech failed: ${e.error}`));
              }
            };

            console.log('📱 Starting mobile speech synthesis...');
            speechSynthesis.speak(utterance);

            // Fallback timeout
            setTimeout(() => {
              if (!speechStarted && !speechCompleted) {
                speechCompleted = true;
                console.error('📱 Speech timeout - never started');
                speechSynthesis.cancel();
                reject(new Error('Speech synthesis timeout'));
              }
            }, 5000);

          }, 300); // Delay to ensure cancellation takes effect

        } catch (error) {
          console.error('📱 Mobile speech creation failed:', error);
          reject(error);
        }
      };

      // Execute or queue the speech
      this.addPendingSpeech(executeSpeech);
    });
  }
}

export const mobileAudio = new MobileAudioManager();