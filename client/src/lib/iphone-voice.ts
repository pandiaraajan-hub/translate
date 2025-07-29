// iPhone-specific voice output handler
export class iPhoneVoice {
  
  // Check if device is iPhone/iPad
  static isIOSDevice(): boolean {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('🍎 iPhone device check:', { userAgent: navigator.userAgent, isIOS });
    return isIOS;
  }

  // iPhone-specific voice output using server-side TTS
  static async speakOnIPhone(text: string, lang: string): Promise<boolean> {
    if (!this.isIOSDevice()) {
      return false;
    }

    try {
      console.log('🍎 iPhone voice output requested:', { text, lang });
      
      // Use server-side TTS for iPhone
      const audioUrl = `/api/tts-audio?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
      
      // iPhone-specific audio handling
      const audio = new Audio();
      
      return new Promise<boolean>((resolve) => {
        let resolved = false;
        
        const resolveOnce = (success: boolean) => {
          if (!resolved) {
            resolved = true;
            resolve(success);
          }
        };

        // iPhone audio context unlock
        this.unlockiPhoneAudio().then(() => {
          audio.oncanplaythrough = () => {
            console.log('🍎 iPhone audio ready to play');
            audio.play().then(() => {
              console.log('🍎 iPhone audio playing successfully');
              resolveOnce(true);
            }).catch((error) => {
              console.error('🍎 iPhone audio play failed:', error);
              resolveOnce(false);
            });
          };

          audio.onerror = (error) => {
            console.error('🍎 iPhone audio error:', error);
            resolveOnce(false);
          };

          audio.onended = () => {
            console.log('🍎 iPhone audio completed');
          };

          // iPhone-specific settings
          audio.volume = 1.0;
          audio.preload = 'auto'; 
          audio.crossOrigin = 'anonymous';
          audio.src = audioUrl;
          
          console.log('🍎 iPhone audio setup:', { audioUrl, volume: audio.volume });
          
          try {
            audio.load();
            console.log('🍎 iPhone audio load initiated');
          } catch (loadError) {
            console.warn('🍎 iPhone audio load warning:', loadError);
          }
        }).catch(() => {
          resolveOnce(false);
        });

        // Timeout after 8 seconds
        setTimeout(() => resolveOnce(false), 8000);
      });

    } catch (error) {
      console.error('🍎 iPhone voice error:', error);
      return false;
    }
  }

  // Unlock iPhone audio context
  private static async unlockiPhoneAudio(): Promise<void> {
    try {
      console.log('🍎 Unlocking iPhone audio context...');
      
      // Create audio context for iPhone
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('🍎 iPhone audio context resumed');
        }
        
        // Create silent buffer to unlock
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        console.log('🍎 iPhone audio unlock completed');
      }
    } catch (error) {
      console.warn('🍎 iPhone audio unlock failed:', error);
    }
  }
}