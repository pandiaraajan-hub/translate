// Mobile audio context manager
class MobileAudioManager {
  private audioContext: AudioContext | null = null;
  private isActivated = false;
  private pendingSpeech: (() => void)[] = [];

  async activateAudio(): Promise<boolean> {
    console.log('📱 Activating mobile audio context...');
    
    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error('📱 AudioContext not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();
      console.log('📱 AudioContext created:', this.audioContext.state);

      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('📱 AudioContext resumed:', this.audioContext.state);
      }

      // Test audio with silent beep
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.01);

      this.isActivated = true;
      console.log('📱 Mobile audio activated successfully');

      // Execute pending speech
      this.pendingSpeech.forEach(fn => fn());
      this.pendingSpeech = [];

      return true;
    } catch (error) {
      console.error('📱 Mobile audio activation failed:', error);
      return false;
    }
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

    return new Promise((resolve, reject) => {
      const executeSpeech = () => {
        try {
          // Cancel any existing speech
          speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          utterance.rate = 0.9;
          utterance.volume = 1.0;
          utterance.pitch = 1.0;

          // Find best voice
          const voices = speechSynthesis.getVoices();
          const voice = voices.find(v => 
            v.lang === lang || 
            v.lang.startsWith(lang.split('-')[0]) ||
            (lang.startsWith('en') && v.lang.startsWith('en'))
          );

          if (voice) {
            utterance.voice = voice;
            console.log('📱 Using voice:', voice.name);
          }

          utterance.onstart = () => {
            console.log('📱 Mobile speech started');
          };

          utterance.onend = () => {
            console.log('📱 Mobile speech completed');
            resolve();
          };

          utterance.onerror = (e) => {
            console.error('📱 Mobile speech error:', e);
            reject(new Error(`Mobile speech failed: ${e.error}`));
          };

          console.log('📱 Starting mobile speech synthesis...');
          speechSynthesis.speak(utterance);

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