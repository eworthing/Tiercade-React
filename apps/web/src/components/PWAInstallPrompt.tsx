import React, { useState, useEffect } from "react";
import { Button } from "@tiercade/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a brief delay
      setTimeout(() => setShowPrompt(true), 2000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }

    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="bg-surface-raised border border-border rounded-xl shadow-modal p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center shrink-0 shadow-glow-gradient">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="pwa-install-title"
              className="text-sm font-semibold text-text"
            >
              Install Tiercade
            </h3>
            <p
              id="pwa-install-description"
              className="text-xs text-text-muted mt-0.5"
            >
              Add to your home screen for quick access and offline support
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-text-subtle hover:text-text p-1 -m-1 transition-colors"
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Features */}
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Works offline
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Faster loading
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            No app store needed
          </li>
        </ul>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDismiss}>
            Not now
          </Button>
          <Button variant="primary" size="sm" onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};

// iOS-specific install instructions
export const IOSInstallInstructions: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-border rounded-xl shadow-modal p-5 m-4 max-w-sm animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-text mb-3">
          Install Tiercade
        </h3>

        <ol className="space-y-4 text-sm text-text-muted">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <span>
              Tap the{" "}
              <svg
                className="w-5 h-5 inline-block align-text-bottom"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>{" "}
              Share button at the bottom of Safari
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <span>Scroll down and tap "Add to Home Screen"</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <span>Tap "Add" in the top right corner</span>
          </li>
        </ol>

        <Button variant="primary" className="w-full mt-4" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
};
