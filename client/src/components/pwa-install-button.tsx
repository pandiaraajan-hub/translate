import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { PWAManager } from "@/lib/pwa-utils";

export function PWAInstallButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const checkInstallState = () => {
      setIsInstalled(PWAManager.isAppInstalled());
      setIsInstallable(PWAManager.isInstallAvailable());
    };

    // Check initial state
    checkInstallState();

    // Listen for install prompt availability
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await PWAManager.install();
      if (!success) {
        // Show manual install instructions
        alert(PWAManager.getInstallInstructions());
      }
    } catch (error) {
      console.error('Install failed:', error);
      alert(PWAManager.getInstallInstructions());
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show install button if installable or on mobile
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isInstallable && !isMobile) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      variant="outline"
      size="sm"
      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
          Installing...
        </>
      ) : (
        <>
          <Smartphone className="h-4 w-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  );
}