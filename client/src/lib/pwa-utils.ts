// PWA utility functions

export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAManager {
  private static deferredPrompt: PWAInstallPrompt | null = null;
  private static isInstalled = false;

  static init() {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isAndroidInstalled = document.referrer.includes('android-app://');
    
    this.isInstalled = isStandalone || isInWebAppiOS || isAndroidInstalled;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      console.log('PWA: Install prompt captured');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
    });
  }

  static async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: Installation accepted');
        return true;
      } else {
        console.log('PWA: Installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA: Installation failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  static isInstallAvailable(): boolean {
    return !!this.deferredPrompt;
  }

  static isAppInstalled(): boolean {
    return this.isInstalled;
  }

  static getInstallInstructions(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      return 'Tap the Share button (⬆️) → "Add to Home Screen" → "Add"';
    } else if (isAndroid) {
      return 'Tap menu (⋮) → "Install app" or "Add to Home screen"';
    } else {
      return 'Look for "Install" option in browser menu';
    }
  }

  static registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('PWA: Service Worker not supported');
      return Promise.resolve(null);
    }

    return navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA: Service Worker registered:', registration.scope);
        return registration;
      })
      .catch((error) => {
        console.error('PWA: Service Worker registration failed:', error);
        return null;
      });
  }

  static addToHomeScreenPrompt(): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS && !(window.navigator as any).standalone) {
      // Show iOS add to home screen instructions
      const banner = document.createElement('div');
      banner.innerHTML = `
        <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #007AFF; color: white; padding: 16px; text-align: center; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <div style="margin-bottom: 8px;">📱 Install VoiceBridge</div>
          <div style="font-size: 14px; margin-bottom: 12px;">Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></div>
          <button onclick="this.parentElement.style.display='none'" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px;">Close</button>
        </div>
      `;
      document.body.appendChild(banner);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (banner.parentElement) {
          banner.parentElement.removeChild(banner);
        }
      }, 10000);
    }
  }
}