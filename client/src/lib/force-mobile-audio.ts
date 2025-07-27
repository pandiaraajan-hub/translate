// Force mobile audio by requiring direct user touch interaction
class ForceMobileAudio {
  private isEnabled = false;
  private pendingText: string | null = null;
  private pendingLang: string | null = null;

  // This must be called directly from a touch/click event
  enableAudioFromTouch(): void {
    console.log('🎯 Enabling audio from direct touch...');
    this.isEnabled = true;
    
    // Create a dummy utterance to wake up speechSynthesis on mobile
    const dummy = new SpeechSynthesisUtterance('');
    dummy.volume = 0;
    speechSynthesis.speak(dummy);
    speechSynthesis.cancel();
    
    // If there's pending text, speak it immediately
    if (this.pendingText) {
      this.speakImmediately(this.pendingText, this.pendingLang || 'en-US');
      this.pendingText = null;
      this.pendingLang = null;
    }
  }

  // Queue text to be spoken when audio is enabled
  queueSpeech(text: string, lang: string = 'en-US'): void {
    console.log('🎯 Queueing speech:', { text, lang });
    this.pendingText = text;
    this.pendingLang = lang;
  }

  // Speak immediately (must be called from touch event context)
  speakImmediately(text: string, lang: string = 'en-US'): void {
    console.log('🎯 Speaking immediately:', { text, lang });
    
    // Cancel any existing speech
    speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
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
      console.log('🎯 Using voice:', voice.name);
    }
    
    utterance.onstart = () => {
      console.log('🎯 Immediate speech started');
    };
    
    utterance.onend = () => {
      console.log('🎯 Immediate speech completed');
    };
    
    utterance.onerror = (e) => {
      console.error('🎯 Immediate speech error:', e);
    };
    
    // Speak directly in touch event context
    speechSynthesis.speak(utterance);
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }
}

export const forceMobileAudio = new ForceMobileAudio();