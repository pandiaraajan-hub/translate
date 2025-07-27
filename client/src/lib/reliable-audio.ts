// Reliable audio playback that works on mobile and desktop
class ReliableAudio {
  private isAudioUnlocked = false;
  
  // Must be called from user interaction (touch/click)
  unlockAudio() {
    if (this.isAudioUnlocked) return;
    
    console.log('🔓 Unlocking audio context...');
    
    // Create silent audio to unlock
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    speechSynthesis.speak(utterance);
    speechSynthesis.cancel();
    
    this.isAudioUnlocked = true;
    console.log('🔓 Audio context unlocked');
  }
  
  // Speak text with fallback strategies
  async speak(text: string, lang: string = 'ta-IN'): Promise<boolean> {
    console.log('🎤 Attempting to speak:', { text, lang });
    
    if (!text.trim()) {
      console.log('🎤 No text to speak');
      return false;
    }
    
    // Ensure audio is unlocked
    this.unlockAudio();
    
    return new Promise((resolve) => {
      // Stop any existing speech
      speechSynthesis.cancel();
      
      // Wait for cancellation to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.8;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        
        // Get available voices with retry
        let voices = speechSynthesis.getVoices();
        console.log('🎤 Available voices:', voices.length);
        
        // If no voices, trigger loading and wait
        if (voices.length === 0) {
          console.log('🎤 No voices found, triggering voice loading...');
          
          // Trigger voice loading
          const dummy = new SpeechSynthesisUtterance('');
          dummy.volume = 0;
          speechSynthesis.speak(dummy);
          speechSynthesis.cancel();
          
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 100));
          voices = speechSynthesis.getVoices();
          console.log('🎤 Voices after loading attempt:', voices.length);
        }
        
        // Find best voice
        const bestVoice = this.findBestVoice(voices, lang);
        if (bestVoice) {
          utterance.voice = bestVoice;
          console.log('🎤 Using voice:', bestVoice.name, bestVoice.lang);
        } else {
          console.log('🎤 Using default voice');
        }
        
        // Set up event handlers
        utterance.onstart = () => {
          console.log('🎤 Speech started successfully');
        };
        
        utterance.onend = () => {
          console.log('🎤 Speech completed successfully');
          resolve(true);
        };
        
        utterance.onerror = (e) => {
          console.error('🎤 Speech error:', e.error);
          resolve(false);
        };
        
        // Start speaking
        console.log('🎤 Starting speechSynthesis.speak()');
        speechSynthesis.speak(utterance);
        
        // Fallback timeout
        setTimeout(() => {
          if (!speechSynthesis.speaking) {
            console.log('🎤 Speech timeout - may have failed silently');
            resolve(false);
          }
        }, 2000);
        
      }, 100);
    });
  }
  
  private findBestVoice(voices: SpeechSynthesisVoice[], targetLang: string) {
    // Priority order for voice selection
    const priorities = [
      (v: SpeechSynthesisVoice) => v.lang === targetLang,
      (v: SpeechSynthesisVoice) => v.lang.startsWith(targetLang.split('-')[0]),
      (v: SpeechSynthesisVoice) => v.lang.includes('ta') && targetLang.includes('ta'),
      (v: SpeechSynthesisVoice) => v.lang.includes('hi') && targetLang.includes('ta'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en') && v.name.includes('Google'),
      (v: SpeechSynthesisVoice) => v.lang.includes('en')
    ];
    
    for (const priority of priorities) {
      const voice = voices.find(priority);
      if (voice) return voice;
    }
    
    return voices[0] || null;
  }
  
  // Test audio system
  async testAudio(): Promise<boolean> {
    console.log('🧪 Testing audio system...');
    return await this.speak('Test', 'en-US');
  }
}

export const reliableAudio = new ReliableAudio();