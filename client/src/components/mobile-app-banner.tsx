import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Download, X, Share } from "lucide-react";

export function MobileAppBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      return; // Already installed
    }

    // Check if user has dismissed the banner
    if (localStorage.getItem('mobileAppBannerDismissed') === 'true') {
      return;
    }

    // Show banner after a delay for mobile users
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setTimeout(() => {
        setShowBanner(true);
      }, 5000); // Show after 5 seconds
    }

    // Listen for install prompt availability
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = () => {
    if (isIOS) {
      // Show iOS install instructions
      alert(
        'To install VoiceBridge on iOS:\n\n' +
        '1. Tap the Share button (⬆️) at the bottom of Safari\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" to install the app\n\n' +
        'The app will appear on your home screen like a native app!'
      );
    } else {
      // Android/Chrome install
      alert(
        'To install VoiceBridge:\n\n' +
        '1. Tap the menu (⋮) in your browser\n' +
        '2. Look for "Install app" or "Add to Home screen"\n' +
        '3. Tap "Install" to add the app\n\n' +
        'The app will work offline and appear in your app drawer!'
      );
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('mobileAppBannerDismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 max-w-sm mx-auto">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-blue-900 mb-1">
              📱 Install VoiceBridge
            </h3>
            <p className="text-xs text-blue-700 mb-3 leading-tight">
              Install as mobile app for faster access, offline support, and native experience!
            </p>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg flex items-center space-x-1"
              >
                {isIOS ? <Share className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                <span>Install</span>
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 text-xs p-2 rounded-lg"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}