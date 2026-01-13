import React, { useState, useEffect } from "react";
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogTrigger,
  Heading,
  IllustratedMessage,
  Text,
} from "@react-spectrum/s2";
import DownloadIllustration from "@react-spectrum/s2/illustrations/linear/Download";

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
    <DialogTrigger isOpen={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <span style={{ display: "none" }}>
        <Button aria-hidden="true">Open</Button>
      </span>
      <Dialog size="S">
        <Heading>Install Tiercade</Heading>
        <Content>
          <IllustratedMessage>
            <DownloadIllustration />
            <Heading>Install this app</Heading>
            <Content>
              <Text>Add Tiercade to your home screen for quick access and offline support.</Text>
              <Text>Features: works offline, faster loading, no app store needed.</Text>
            </Content>
          </IllustratedMessage>
        </Content>
        <ButtonGroup>
          <Button variant="secondary" onPress={handleDismiss}>
            Not now
          </Button>
          <Button variant="accent" onPress={handleInstall}>
            Install
          </Button>
        </ButtonGroup>
      </Dialog>
    </DialogTrigger>
  );
};

// iOS-specific install instructions
export const IOSInstallInstructions: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  return (
    <DialogTrigger isOpen onOpenChange={(open) => !open && onClose()}>
      <span style={{ display: "none" }}>
        <Button aria-hidden="true">Open</Button>
      </span>
      <Dialog size="S">
        <Heading>Install Tiercade</Heading>
        <Content>
          <Text>On iOS Safari:</Text>
          <Text>1) Tap the Share button.</Text>
          <Text>2) Scroll and tap “Add to Home Screen”.</Text>
          <Text>3) Tap “Add”.</Text>
        </Content>
        <ButtonGroup>
          <Button variant="secondary" onPress={onClose}>
            Got it
          </Button>
        </ButtonGroup>
      </Dialog>
    </DialogTrigger>
  );
};
