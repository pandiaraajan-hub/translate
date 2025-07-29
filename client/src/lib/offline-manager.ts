// Offline functionality manager for VoiceBridge PWA

export class OfflineManager {
  private static isOnline = true;
  private static callbacks: ((online: boolean) => void)[] = [];

  static init() {
    // Set initial online status
    this.isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('PWA: Back online');
      this.isOnline = true;
      this.notifyCallbacks(true);
    });

    window.addEventListener('offline', () => {
      console.log('PWA: Gone offline');
      this.isOnline = false;
      this.notifyCallbacks(false);
    });

    // Check connection periodically
    setInterval(() => {
      this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  static isOnlineNow(): boolean {
    return this.isOnline;
  }

  static addOnlineCallback(callback: (online: boolean) => void) {
    this.callbacks.push(callback);
  }

  static removeOnlineCallback(callback: (online: boolean) => void) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private static notifyCallbacks(online: boolean) {
    this.callbacks.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('Error in online status callback:', error);
      }
    });
  }

  private static async checkConnection() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const newOnlineStatus = response.ok;
      if (newOnlineStatus !== this.isOnline) {
        this.isOnline = newOnlineStatus;
        this.notifyCallbacks(newOnlineStatus);
      }
    } catch (error) {
      if (this.isOnline) {
        console.log('PWA: Connection check failed, going offline');
        this.isOnline = false;
        this.notifyCallbacks(false);
      }
    }
  }

  static async cacheTranslation(translation: any) {
    try {
      const cache = await caches.open('voicebridge-translations');
      const key = `translation-${Date.now()}`;
      await cache.put(
        new Request(key),
        new Response(JSON.stringify(translation))
      );
      console.log('PWA: Translation cached for offline access');
    } catch (error) {
      console.error('PWA: Failed to cache translation:', error);
    }
  }

  static async getCachedTranslations(): Promise<any[]> {
    try {
      const cache = await caches.open('voicebridge-translations');
      const keys = await cache.keys();
      const translations = [];

      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const translation = await response.json();
          translations.push(translation);
        }
      }

      return translations.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('PWA: Failed to get cached translations:', error);
      return [];
    }
  }
}