// External TTS service for Samsung devices
export class ExternalTTS {
  
  // Try multiple external TTS services for Samsung compatibility
  static async speakWithExternalService(text: string, lang: string): Promise<boolean> {
    console.log('🌐 Trying external TTS services for Samsung...');
    
    // Method 1: ResponsiveVoice API (free tier)
    const responsiveVoiceSuccess = await this.tryResponsiveVoice(text, lang);
    if (responsiveVoiceSuccess) return true;
    
    // Method 2: Web Speech API with forced browser audio
    const forcedWebSpeechSuccess = await this.tryForcedWebSpeech(text, lang);
    if (forcedWebSpeechSuccess) return true;
    
    // Method 3: Google Translate TTS URL
    const googleTTSSuccess = await this.tryGoogleTTS(text, lang);
    if (googleTTSSuccess) return true;
    
    return false;
  }
  
  // Method 1: ResponsiveVoice (external service)
  private static async tryResponsiveVoice(text: string, lang: string): Promise<boolean> {
    try {
      // Check if ResponsiveVoice is available
      if (typeof (window as any).responsiveVoice !== 'undefined') {
        console.log('🎙️ Using ResponsiveVoice TTS');
        
        const voiceName = this.getResponsiveVoiceLanguage(lang);
        
        return new Promise<boolean>((resolve) => {
          (window as any).responsiveVoice.speak(text, voiceName, {
            onend: () => {
              console.log('🎙️ ResponsiveVoice completed');
              resolve(true);
            },
            onerror: () => {
              console.log('🎙️ ResponsiveVoice failed');
              resolve(false);
            }
          });
          
          // Timeout after 10 seconds
          setTimeout(() => resolve(false), 10000);
        });
      }
      
      return false;
    } catch (error) {
      console.error('🎙️ ResponsiveVoice error:', error);
      return false;
    }
  }
  
  // Method 2: Forced Web Speech with different approach
  private static async tryForcedWebSpeech(text: string, lang: string): Promise<boolean> {
    try {
      console.log('🔊 Trying forced Web Speech API');
      
      // Create multiple audio contexts to unlock audio
      await this.unlockAllAudioContexts();
      
      const speechSynth = window.speechSynthesis;
      
      // Completely reset speech synthesis
      speechSynth.cancel();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return new Promise<boolean>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.7;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use any available voice
        const voices = speechSynth.getVoices();
        if (voices.length > 0) {
          // Try default voice first
          utterance.voice = voices[0];
        }
        
        let resolved = false;
        
        utterance.onstart = () => {
          console.log('🔊 Forced speech started');
        };
        
        utterance.onend = () => {
          if (!resolved) {
            resolved = true;
            console.log('🔊 Forced speech completed');
            resolve(true);
          }
        };
        
        utterance.onerror = () => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        };
        
        // Try speaking immediately and with delays
        try {
          speechSynth.speak(utterance);
          
          // Backup attempts
          setTimeout(() => {
            if (!speechSynth.speaking && !resolved) {
              speechSynth.speak(utterance);
            }
          }, 500);
          
          setTimeout(() => {
            if (!speechSynth.speaking && !resolved) {
              speechSynth.speak(utterance);
            }
          }, 1000);
          
        } catch (error) {
          console.error('🔊 Forced speech failed:', error);
          resolve(false);
        }
        
        // Timeout
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, 8000);
      });
      
    } catch (error) {
      console.error('🔊 Forced Web Speech error:', error);
      return false;
    }
  }
  
  // Method 3: Google Translate TTS
  private static async tryGoogleTTS(text: string, lang: string): Promise<boolean> {
    try {
      console.log('🌐 Trying Google Translate TTS');
      
      // Encode text for URL
      const encodedText = encodeURIComponent(text.substring(0, 200)); // Limit length
      const langCode = this.getGoogleTTSLanguage(lang);
      
      // Google Translate TTS URL
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${langCode}`;
      
      // Create audio element
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      
      return new Promise<boolean>((resolve) => {
        audio.oncanplaythrough = () => {
          audio.play().then(() => {
            console.log('🌐 Google TTS started playing');
            resolve(true);
          }).catch(() => {
            resolve(false);
          });
        };
        
        audio.onerror = () => {
          console.log('🌐 Google TTS failed');
          resolve(false);
        };
        
        audio.onended = () => {
          console.log('🌐 Google TTS completed');
        };
        
        // Try to load the audio
        audio.src = ttsUrl;
        audio.load();
        
        // Timeout
        setTimeout(() => resolve(false), 8000);
      });
      
    } catch (error) {
      console.error('🌐 Google TTS error:', error);
      return false;
    }
  }
  
  // Unlock all possible audio contexts
  private static async unlockAllAudioContexts(): Promise<void> {
    try {
      // Method 1: Standard audio element
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.volume = 0.01;
      try {
        await audio.play();
      } catch (e) {
        // Ignore
      }
      
      // Method 2: Web Audio API
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Create and play a brief silent tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.01);
        
      } catch (e) {
        // Ignore
      }
      
      console.log('🔓 Audio contexts unlocked');
    } catch (error) {
      console.log('🔓 Audio unlock failed:', error);
    }
  }
  
  // Helper: Get ResponsiveVoice language
  private static getResponsiveVoiceLanguage(lang: string): string {
    const mapping: { [key: string]: string } = {
      'ta': 'Tamil Male',
      'ta-IN': 'Tamil Male',
      'en': 'UK English Male',
      'en-US': 'US English Male',
      'en-GB': 'UK English Male',
      'zh': 'Chinese Male',
      'zh-CN': 'Chinese Male',
      'hi': 'Hindi Male',
      'hi-IN': 'Hindi Male',
      'ms': 'Malay Male',
      'ms-MY': 'Malay Male',
      'bn': 'Bangla Male',
      'bn-IN': 'Bangla Male'
    };
    
    return mapping[lang] || 'UK English Male';
  }
  
  // Helper: Get Google TTS language code
  private static getGoogleTTSLanguage(lang: string): string {
    const mapping: { [key: string]: string } = {
      'ta': 'ta',
      'ta-IN': 'ta',
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en',
      'zh': 'zh',
      'zh-CN': 'zh-cn',
      'hi': 'hi',
      'hi-IN': 'hi',
      'ms': 'ms',
      'ms-MY': 'ms',
      'bn': 'bn',
      'bn-IN': 'bn'
    };
    
    return mapping[lang] || 'en';
  }
}