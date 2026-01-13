import React, { useState, useEffect } from "react";
import { Button } from "@react-spectrum/s2";

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
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        maxWidth: 384,
        marginLeft: "auto"
      }}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div style={{
        backgroundColor: "var(--spectrum-gray-100)",
        border: "1px solid var(--spectrum-gray-300)",
        borderRadius: 12,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: "var(--spectrum-blue-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <svg
              style={{ width: 24, height: 24, color: "var(--spectrum-blue-900)" }}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="pwa-install-title"
              style={{ fontSize: 14, fontWeight: 600, color: "var(--spectrum-gray-900)" }}
            >
              Install Tiercade
            </h3>
            <p
              id="pwa-install-description"
              style={{ fontSize: 12, color: "var(--spectrum-gray-700)", marginTop: 2 }}
            >
              Add to your home screen for quick access and offline support
            </p>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              color: "var(--spectrum-gray-600)",
              padding: 4,
              margin: -4,
              background: "none",
              border: "none",
              cursor: "pointer"
            }}
            aria-label="Dismiss"
          >
            <svg
              style={{ width: 16, height: 16 }}
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
        <ul style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--spectrum-gray-700)", listStyle: "none", margin: 0, padding: 0 }}>
          <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg
              style={{ width: 14, height: 14, color: "var(--spectrum-green-800)" }}
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
          <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg
              style={{ width: 14, height: 14, color: "var(--spectrum-green-800)" }}
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
          <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg
              style={{ width: 14, height: 14, color: "var(--spectrum-green-800)" }}
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
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="S" onPress={handleDismiss}>
            Not now
          </Button>
          <Button variant="accent" size="S" onPress={handleInstall}>
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--spectrum-gray-100)",
          border: "1px solid var(--spectrum-gray-300)",
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.1)",
          padding: 20,
          margin: 16,
          maxWidth: 384
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--spectrum-gray-900)", marginBottom: 12 }}>
          Install Tiercade
        </h3>

        <ol style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 14, color: "var(--spectrum-gray-700)", margin: 0, padding: 0, listStyle: "none" }}>
          <li style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "var(--spectrum-blue-700)",
              color: "white",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              1
            </span>
            <span>
              Tap the{" "}
              <svg
                style={{ width: 20, height: 20, display: "inline-block", verticalAlign: "text-bottom" }}
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
          <li style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "var(--spectrum-blue-700)",
              color: "white",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              2
            </span>
            <span>Scroll down and tap "Add to Home Screen"</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "var(--spectrum-blue-700)",
              color: "white",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              3
            </span>
            <span>Tap "Add" in the top right corner</span>
          </li>
        </ol>

        <div style={{ marginTop: 16, width: "100%" }}>
          <Button variant="accent" onPress={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};
