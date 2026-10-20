// ============================================================
// PWA Install Prompt & Offline Status Component
// ============================================================

import { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Monitor online/offline state
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect if already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('mun_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 1000 * 60 * 60 * 24 * 3) {
      // Dismissed within last 3 days
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Handle BeforeInstallPrompt (Chrome/Edge/Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If on iOS and not standalone, show prompt after 4 seconds
    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('mun_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Offline Toast Banner */}
      {isOffline && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <WifiOff size={16} />
          <span>You are browsing offline. Cached events and calendar remain fully accessible.</span>
        </div>
      )}

      {/* PWA Install Promotion Card */}
      {showPrompt && !isOffline && (
        <aside
          aria-label="Install web application"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 2000,
            maxWidth: '380px',
            width: 'calc(100% - 48px)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            padding: '18px',
            animation: 'slideUp 0.25s ease',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-accent-primary), #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Smartphone size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Install MUN Central App
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                  Fast offline access & deadline alerts
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 2 }}
              aria-label="Dismiss install prompt"
            >
              <X size={16} />
            </button>
          </div>

          {isIOS ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: '8px', lineHeight: 1.4 }}>
              To install on your iPhone or iPad: tap <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Share</strong>, then scroll and select <strong>Add to Home Screen</strong>.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleInstallClick}
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                <Download size={14} /> Install Now
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDismiss}
                style={{ fontSize: '0.8rem' }}
              >
                Not Now
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
