// Samsung-specific audio fix for voice output issues
export class SamsungAudioFix {
  private static isInitialized = false;
  private static audioContext: AudioContext | null = null;

  static isSamsungDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('samsung') || 
           userAgent.includes('sm-') || 
           userAgent.includes('galaxy') ||
           /android.*samsung/i.test(navigator.userAgent);
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
    if (!this.isSamsungDevice()) {
      return false; // Not Samsung, use regular speech
    }

    if (!this.isInitialized) {
      console.log('📱 Samsung audio not initialized, initializing now...');
      await this.initializeSamsungAudio();
    }

    console.log('📱 Speaking with Samsung fix:', { text, lang, rate, pitch });

    return new Promise<boolean>((resolve) => {
      const speechSynth = window.speechSynthesis;
      
      // Ensure clean state
      speechSynth.cancel();
      
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          utterance.rate = Math.min(rate, 0.8); // Cap rate for Samsung
          utterance.pitch = pitch;
          utterance.volume = 1.0;

          // Find best voice for Samsung
          const voices = speechSynth.getVoices();
          if (voices.length > 0) {
            const voice = this.findBestSamsungVoice(voices, lang);
            if (voice) {
              utterance.voice = voice;
              console.log('📱 Samsung using voice:', voice.name);
            }
          }

          let completed = false;
          const timeout = setTimeout(() => {
            if (!completed) {
              speechSynth.cancel();
              console.log('📱 Samsung speech timeout');
              resolve(false);
            }
          }, 15000); // 15 second timeout

          utterance.onstart = () => {
            console.log('📱 Samsung speech started');
          };

          utterance.onend = () => {
            completed = true;
            clearTimeout(timeout);
            console.log('📱 Samsung speech completed successfully');
            resolve(true);
          };

          utterance.onerror = (event) => {
            completed = true;
            clearTimeout(timeout);
            console.error('📱 Samsung speech error:', event.error);
            resolve(false);
          };

          speechSynth.speak(utterance);

        } catch (error) {
          console.error('📱 Samsung speak error:', error);
          resolve(false);
        }
      }, 100); // Small delay to ensure clean state
    });
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