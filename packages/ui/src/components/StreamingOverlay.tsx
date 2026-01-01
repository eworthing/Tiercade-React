import React from "react";
import type { Item } from "@tiercade/core";

export interface StreamingOverlayProps {
  /** Whether presentation mode is active */
  isPresenting: boolean;
  /** Current item being ranked */
  currentItem?: Item | null;
  /** Whether to show the current item overlay */
  showCurrentItem: boolean;
  /** Total items to rank */
  totalItems: number;
  /** Items already ranked */
  rankedItems: number;
  /** Whether to show progress bar */
  showProgress: boolean;
  /** Watermark text */
  watermarkText?: string;
  /** Whether to show watermark */
  showWatermark: boolean;
  /** Items remaining in queue */
  queueRemaining: number;
}

export const StreamingOverlay: React.FC<StreamingOverlayProps> = ({
  isPresenting,
  currentItem,
  showCurrentItem,
  totalItems,
  rankedItems,
  showProgress,
  watermarkText,
  showWatermark,
  queueRemaining,
}) => {
  if (!isPresenting) return null;

  const progress = totalItems > 0 ? (rankedItems / totalItems) * 100 : 0;

  return (
    <>
      {/* Current Item Overlay */}
      {showCurrentItem && currentItem && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-6 py-3 bg-surface-raised/95 backdrop-blur-sm border border-border rounded-xl shadow-modal">
            {currentItem.imageUrl && (
              <img
                src={currentItem.imageUrl}
                alt=""
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide">
                Now Ranking
              </p>
              <p className="text-lg font-semibold text-text">
                {currentItem.name ?? currentItem.id}
              </p>
            </div>
            {queueRemaining > 0 && (
              <div className="ml-4 pl-4 border-l border-border">
                <p className="text-xs text-text-muted">{queueRemaining} left</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && totalItems > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted whitespace-nowrap">
              {rankedItems} / {totalItems}
            </span>
            <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}

      {/* Watermark */}
      {showWatermark && watermarkText && (
        <div className="fixed bottom-4 right-4 z-50">
          <p className="text-sm font-medium text-text/50 select-none">
            {watermarkText}
          </p>
        </div>
      )}
    </>
  );
};

export interface MysteryCardProps {
  item: Item;
  isRevealed: boolean;
  onReveal: () => void;
  scale?: number;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const MysteryCard: React.FC<MysteryCardProps> = ({
  item,
  isRevealed,
  onReveal,
  scale = 1,
  isSelected,
  onClick,
  onDoubleClick,
}) => {
  const handleClick = () => {
    if (!isRevealed) {
      onReveal();
    } else {
      onClick?.();
    }
  };

  const cardStyle = {
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  };

  if (!isRevealed) {
    return (
      <div
        className="relative w-20 h-20 rounded-card cursor-pointer transition-all duration-300 hover:scale-105 group"
        style={cardStyle}
        onClick={handleClick}
      >
        {/* Mystery card back */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-card flex items-center justify-center overflow-hidden">
          {/* Animated pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2)_0%,transparent_50%)] animate-pulse" />
          </div>
          {/* Question mark */}
          <span className="text-3xl font-bold text-white/90 group-hover:scale-110 transition-transform">
            ?
          </span>
        </div>
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-card ring-2 ring-transparent group-hover:ring-purple-400/50 transition-all" />
      </div>
    );
  }

  // Revealed card - show the actual item
  const hasImage = !!item.imageUrl;
  const hasVideo = !!item.videoUrl;
  const hasAudio = !!item.audioUrl;
  const hasMedia = hasImage || hasVideo || hasAudio;

  return (
    <div
      className={`
        relative w-20 h-20 rounded-card cursor-pointer transition-all duration-300
        animate-in zoom-in-50 fade-in duration-500
        ${isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}
      `}
      style={cardStyle}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      {hasVideo ? (
        <video
          src={item.videoUrl}
          className="w-full h-full object-cover rounded-card"
          loop
          muted
          playsInline
          autoPlay
        />
      ) : hasAudio ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-raised rounded-card">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span className="text-2xs text-text-muted mt-1 truncate max-w-[90%]">
            {item.name ?? item.id}
          </span>
        </div>
      ) : hasImage ? (
        <>
          <img
            src={item.imageUrl}
            alt={item.name ?? item.id}
            className="w-full h-full object-cover rounded-card"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-card">
            <p className="text-2xs text-white text-center truncate font-medium">
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-raised rounded-card p-2">
          <span className="text-xs text-text text-center leading-tight font-medium">
            {item.name ?? item.id}
          </span>
        </div>
      )}
    </div>
  );
};

export interface TierCelebrationProps {
  tier: string;
  show: boolean;
  onComplete: () => void;
}

// Pre-compute celebration particles to avoid Math.random() in render
const CELEBRATION_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5) % 100}%`,
  top: `${((i * 7) + 10) % 100}%`,
  animationDelay: `${(i % 5) * 0.1}s`,
  animationDuration: `${1 + (i % 3) * 0.3}s`,
  emoji: ["⭐", "✨", "🌟"][i % 3],
}));

export const TierCelebration: React.FC<TierCelebrationProps> = ({
  tier,
  show,
  onComplete,
}) => {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const isTopTier = tier === "S" || tier === "s";

  if (!isTopTier) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Burst effect */}
      <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-0 fade-in duration-300">
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 blur-3xl bg-yellow-500/30 rounded-full animate-pulse" />
          {/* Star burst */}
          <div className="text-6xl animate-bounce">
            ⭐
          </div>
        </div>
      </div>
      {/* Floating stars - use pre-computed values */}
      {CELEBRATION_PARTICLES.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl animate-float"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
};
