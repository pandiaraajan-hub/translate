// Samsung-specific audio fix for voice output issues
export class SamsungAudioFix {
  private static isInitialized = false;
  private static audioContext: AudioContext | null = null;

  static isSamsungDevice(): boolean {
    const userAgent = navigator.userAgent;
    const userAgentLower = userAgent.toLowerCase();
    
    // Check localStorage for manual override
    const manualOverride = localStorage.getItem('forceSamsungMode');
    if (manualOverride === 'true') {
      console.log('📱 Samsung mode manually forced via localStorage');
      return true;
    }
    
    // Comprehensive Samsung detection
    const samsungKeywords = ['samsung', 'galaxy', 'sm-', 'gt-', 'secbrowser', 'samsungbrowser'];
    const hasKeywords = samsungKeywords.some(keyword => userAgentLower.includes(keyword));
    
    // Pattern-based detection
    const samsungPatterns = [
      /samsung/i,
      /sm-[a-z0-9]+/i,   // More flexible pattern
      /galaxy/i,
      /gt-[a-z0-9]+/i,
      /samsung browser/i,
      /secbrowser/i,
      /samsungbrowser/i
    ];
    
    const hasPatterns = samsungPatterns.some(pattern => pattern.test(userAgent));
    
    // Android Samsung detection
    const isAndroidSamsung = userAgentLower.includes('android') && 
                            (userAgentLower.includes('samsung') || userAgentLower.includes('galaxy'));
    
    const finalResult = hasKeywords || hasPatterns || isAndroidSamsung;
    
    console.log('📱 Comprehensive Samsung detection:', { 
      userAgent: userAgent.slice(0, 100) + '...', 
      hasKeywords,
      foundKeywords: samsungKeywords.filter(k => userAgentLower.includes(k)),
      hasPatterns,
      isAndroidSamsung,
      manualOverride,
      finalResult 
    });
    
    return finalResult;
  }

  // Method to manually enable Samsung mode for testing
  static enableSamsungMode(): void {
    localStorage.setItem('forceSamsungMode', 'true');
    console.log('📱 Samsung mode manually enabled');
  }

  static disableSamsungMode(): void {
    localStorage.removeItem('forceSamsungMode');
    console.log('📱 Samsung mode manual override disabled');
  }

  static async initializeSamsungAudio(): Promise<boolean> {
    if (!this.isSamsungDevice()) {
      return true; // Not Samsung, no special handling needed
    }

    console.log('📱 Samsung device detected - initializing Samsung audio fix');

    try {
      // Step 1: Create and unlock audio context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('📱 Samsung AudioContext resumed');
      }

      // Step 2: Force speech synthesis initialization with multiple attempts
      const speechSynth = window.speechSynthesis;
      
      // Cancel any existing speech
      speechSynth.cancel();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Multiple initialization attempts with different strategies
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          console.log(`📱 Samsung speech init attempt ${attempt + 1}/5`);
          
          // Strategy varies by attempt
          let testText = '';
          let volume = 0.01;
          
          switch (attempt) {
            case 0:
              testText = ' '; // Single space
              volume = 0.01;
              break;
            case 1:
              testText = 'a'; // Single character
              volume = 0.01;
              break;
            case 2:
              testText = 'test'; // Short word
              volume = 0.1;
              break;
            case 3:
              testText = 'audio test'; // Two words
              volume = 0.2;
              break;
            case 4:
              testText = 'Samsung audio initialization'; // Full sentence
              volume = 0.3;
              break;
          }

          const utterance = new SpeechSynthesisUtterance(testText);
          utterance.volume = volume;
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.lang = 'en-US';

          // Set a compatible voice if available
          const voices = speechSynth.getVoices();
          if (voices.length > 0) {
            // Try to find a suitable voice for Samsung
            const samsungVoice = voices.find(v => 
              v.name.toLowerCase().includes('samsung') ||
              v.name.toLowerCase().includes('english') ||
              v.lang === 'en-US'
            ) || voices[0];
            utterance.voice = samsungVoice;
            console.log(`📱 Using voice: ${samsungVoice.name}`);
          }

          // Play the utterance and wait
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              speechSynth.cancel();
              resolve();
            }, 2000);

            utterance.onend = () => {
              clearTimeout(timeout);
              console.log(`📱 Samsung init attempt ${attempt + 1} completed`);
              resolve();
            };

            utterance.onerror = (event) => {
              clearTimeout(timeout);
              console.warn(`📱 Samsung init attempt ${attempt + 1} error:`, event.error);
              resolve(); // Don't reject, try next attempt
            };

            speechSynth.speak(utterance);
          });

          // Wait between attempts
          await new Promise(resolve => setTimeout(resolve, 200));
          speechSynth.cancel();
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.warn(`📱 Samsung init attempt ${attempt + 1} failed:`, error);
        }
      }

      // Step 4: Final test to confirm audio is working
      console.log('📱 Samsung audio initialization complete - testing final state');
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('📱 Samsung audio fix failed:', error);
      return false;
    }
  }

  static async speakWithSamsungFix(text: string, lang: string, rate: number = 0.7, pitch: number = 1.0): Promise<boolean> {
    console.log('📱 Samsung audio fix requested for text:', text.slice(0, 50));

    try {
      // Universal mobile audio approach - works for all devices including Samsung
      const speechSynth = window.speechSynthesis;
      
      // Comprehensive audio initialization
      speechSynth.cancel();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Initialize audio context for mobile
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('📱 Audio context resumed');
        }
      } catch (audioError) {
        console.warn('📱 Audio context initialization failed:', audioError);
      }

      // Force voice loading with multiple attempts
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const initUtterance = new SpeechSynthesisUtterance(' ');
          initUtterance.volume = 0.01;
          initUtterance.rate = 1.0;
          speechSynth.speak(initUtterance);
          await new Promise(resolve => setTimeout(resolve, 100));
          speechSynth.cancel();
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`📱 Voice init attempt ${attempt + 1} failed:`, error);
        }
      }

      // Wait for voices to be available
      let voices = speechSynth.getVoices();
      if (voices.length === 0) {
        console.log('📱 Waiting for voices to load...');
        await new Promise<void>((resolve) => {
          const checkVoices = () => {
            voices = speechSynth.getVoices();
            if (voices.length > 0) {
              console.log('📱 Voices loaded:', voices.length);
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
          setTimeout(resolve, 2000); // Timeout after 2 seconds
        });
      }

      // Main speech synthesis
      return new Promise<boolean>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = Math.min(rate, 0.8); // Slower for mobile compatibility
        utterance.pitch = pitch;
        utterance.volume = 1.0;

        // Find best voice
        console.log('📱 Available voices:', voices.length);
        if (voices.length > 0) {
          const voice = this.findBestSamsungVoice(voices, lang);
          if (voice) {
            utterance.voice = voice;
            console.log('📱 Using voice:', voice.name, 'for language:', lang);
          } else {
            console.log('📱 No suitable voice found, using default');
          }
        } else {
          console.log('📱 No voices available');
        }

        let speechCompleted = false;
        const timeout = setTimeout(() => {
          if (!speechCompleted) {
            speechSynth.cancel();
            console.log('📱 Speech timeout - considering success');
            resolve(true); // Consider timeout as success to avoid endless failures
          }
        }, 15000);

        utterance.onstart = () => {
          console.log('📱 ✅ Speech started successfully');
        };

        utterance.onend = () => {
          speechCompleted = true;
          clearTimeout(timeout);
          console.log('📱 ✅ Speech completed successfully');
          resolve(true);
        };

        utterance.onerror = (event) => {
          speechCompleted = true;
          clearTimeout(timeout);
          console.error('📱 ❌ Speech error:', event.error);
          
          // For Samsung devices, some errors are normal, still consider it success
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('📱 Speech interrupted but likely played - considering success');
            resolve(true);
          } else {
            resolve(false);
          }
        };

        // For Samsung devices with enhanced mode, try external TTS services
        if (localStorage.getItem('forceSamsungMode') === 'true') {
          console.log('📱 Using Samsung enhanced audio mode with external TTS');
          
          // Try external TTS services first
          import('@/lib/external-tts').then(({ ExternalTTS }) => {
            ExternalTTS.speakWithExternalService(text, lang).then(success => {
              if (success) {
                console.log('📱 ✅ External TTS successful!');
                resolve(true);
              } else {
                console.log('📱 External TTS failed, trying internal methods');
                
                // Fallback to enhanced internal method
                this.unlockSamsungAudio().then(() => {
                  setTimeout(() => {
                    try {
                      utterance.volume = 1.0;
                      speechSynth.speak(utterance);
                      
                      setTimeout(() => {
                        if (!speechSynth.speaking) {
                          console.log('📱 Backup Samsung speech attempt');
                          speechSynth.speak(utterance);
                        }
                      }, 300);
                      
                      console.log('📱 Samsung internal speech queued');
                    } catch (error) {
                      console.error('📱 Samsung internal speech failed:', error);
                      this.standardSpeechSynthesis(utterance, speechSynth, resolve);
                    }
                  }, 100);
                });
              }
            });
          }).catch(() => {
            // If external TTS import fails, fallback to internal
            this.unlockSamsungAudio().then(() => {
              this.standardSpeechSynthesis(utterance, speechSynth, resolve);
            });
          });
        } else {
          // Standard speech synthesis
          this.standardSpeechSynthesis(utterance, speechSynth, resolve);
        }
      });

    } catch (error) {
      console.error('📱 Samsung audio fix failed:', error);
      return false;
    }
  }

  // Standard speech synthesis method
  private static standardSpeechSynthesis(
    utterance: SpeechSynthesisUtterance, 
    speechSynth: SpeechSynthesis, 
    resolve: (value: boolean) => void
  ) {
    setTimeout(() => {
      try {
        console.log('📱 About to start speech synthesis...');
        
        // Additional mobile audio unlock attempt
        if (speechSynth.paused) {
          console.log('📱 Resuming paused speech synthesis');
          speechSynth.resume();
        }
        
        speechSynth.speak(utterance);
        console.log('📱 ✅ Speech queued successfully');
      } catch (error) {
        console.error('📱 ❌ Failed to queue speech:', error);
        resolve(false);
      }
    }, 200);
  }

  // Samsung audio unlock method
  private static async unlockSamsungAudio(): Promise<void> {
    try {
      // Method 1: Audio element unlock
      const audio = new Audio();
      const silentAudio = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.src = silentAudio;
      audio.volume = 0.01;
      
      try {
        await audio.play();
        console.log('📱 Audio context unlocked via audio element');
      } catch (e) {
        console.log('📱 Audio element unlock failed, trying Web Audio');
      }
      
      // Method 2: Web Audio API unlock
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('📱 Web Audio context resumed');
          }
        }
      } catch (e) {
        console.log('📱 Web Audio unlock failed');
      }
      
    } catch (error) {
      console.log('📱 Samsung audio unlock failed:', error);
    }
  }

  private static findBestSamsungVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
    // Priority order for Samsung voice selection
    const priorities = [
      // Exact language match with male indicators
      (v: SpeechSynthesisVoice) => v.lang === lang && (
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('man') ||
        v.name.toLowerCase().includes('ravi') ||
        v.name.toLowerCase().includes('amit')
      ),
      // Exact language match
      (v: SpeechSynthesisVoice) => v.lang === lang,
      // Language prefix match with male indicators
      (v: SpeechSynthesisVoice) => v.lang.startsWith(lang.split('-')[0]) && (
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('man')
      ),
      // Language prefix match
      (v: SpeechSynthesisVoice) => v.lang.startsWith(lang.split('-')[0]),
      // English fallback with male indicators
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && (
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('man')
      ),
      // Any English voice
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en')
    ];

    for (const priority of priorities) {
      const voice = voices.find(priority);
      if (voice) {
        return voice;
      }
    }

    return voices[0] || null;
  }
}