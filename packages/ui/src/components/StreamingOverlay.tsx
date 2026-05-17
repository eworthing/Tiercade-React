import React, { useState } from "react";
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

  const currentItemOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
    animation: "fadeSlideIn 0.3s ease-out",
  };

  const currentItemCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 24px",
    backgroundColor: "rgba(var(--spectrum-gray-100-rgb, 50, 50, 50), 0.95)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--spectrum-gray-300)",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  };

  const progressBarContainerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
    width: "80%",
    maxWidth: 576,
  };

  const progressBarWrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const progressBarTrackStyle: React.CSSProperties = {
    flex: 1,
    height: 8,
    backgroundColor: "var(--spectrum-gray-200)",
    borderRadius: 9999,
    overflow: "hidden",
    border: "1px solid var(--spectrum-gray-300)",
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: "100%",
    background: "linear-gradient(to right, var(--spectrum-blue-700), var(--spectrum-blue-500))",
    borderRadius: 9999,
    transition: "width 0.5s ease-out",
    width: `${progress}%`,
  };

  const watermarkStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 50,
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(var(--spectrum-gray-900-rgb, 255, 255, 255), 0.5)",
    userSelect: "none",
  };

  return (
    <>
      {/* Current Item Overlay */}
      {showCurrentItem && currentItem && (
        <div style={currentItemOverlayStyle}>
          <div style={currentItemCardStyle}>
            {(currentItem.media?.type === "image" || currentItem.media?.type === "gif") && (
              <img
                src={currentItem.media.url}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
            )}
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--spectrum-gray-600)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Now Ranking
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--spectrum-gray-900)",
                }}
              >
                {currentItem.name ?? currentItem.id}
              </p>
            </div>
            {queueRemaining > 0 && (
              <div
                style={{
                  marginLeft: 16,
                  paddingLeft: 16,
                  borderLeft: "1px solid var(--spectrum-gray-300)",
                }}
              >
                <p style={{ fontSize: 12, color: "var(--spectrum-gray-600)" }}>
                  {queueRemaining} left
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && totalItems > 0 && (
        <div style={progressBarContainerStyle}>
          <div style={progressBarWrapperStyle}>
            <span
              style={{
                fontSize: 12,
                color: "var(--spectrum-gray-600)",
                whiteSpace: "nowrap",
              }}
            >
              {rankedItems} / {totalItems}
            </span>
            <div style={progressBarTrackStyle}>
              <div style={progressBarFillStyle} />
            </div>
            <span
              style={{
                fontSize: 12,
                color: "var(--spectrum-gray-600)",
                whiteSpace: "nowrap",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}

      {/* Watermark */}
      {showWatermark && watermarkText && (
        <div style={watermarkStyle}>
          {watermarkText}
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
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!isRevealed) {
      onReveal();
    } else {
      onClick?.();
    }
  };

  const cardStyle: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  };

  const baseCardStyle: React.CSSProperties = {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    cursor: "pointer",
    transition: "transform 0.3s ease",
  };

  if (!isRevealed) {
    return (
      <div
        style={{
          ...baseCardStyle,
          ...cardStyle,
          transform: `${cardStyle.transform} scale(${isHovered ? 1.05 : 1})`,
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mystery card back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #9333ea, #4f46e5)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Animated pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.3,
              background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          {/* Question mark */}
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.9)",
              transition: "transform 0.2s ease",
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            ?
          </span>
        </div>
        {/* Glow effect on hover */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            boxShadow: isHovered ? "0 0 0 2px rgba(168, 85, 247, 0.5)" : "0 0 0 2px transparent",
            transition: "box-shadow 0.2s ease",
          }}
        />
      </div>
    );
  }

  // Revealed card - show the actual item
  const media = item.media;
  const hasImage = media?.type === "image" || media?.type === "gif";
  const hasVideo = media?.type === "video";
  const hasAudio = media?.type === "audio";

  const selectedRingStyle: React.CSSProperties = isSelected
    ? {
        boxShadow: "0 0 0 2px var(--spectrum-blue-700), 0 0 0 4px var(--spectrum-gray-100)",
      }
    : {};

  return (
    <div
      style={{
        ...baseCardStyle,
        ...cardStyle,
        ...selectedRingStyle,
        animation: "zoomFadeIn 0.5s ease-out",
      }}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      {hasVideo ? (
        <video
          src={media!.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 8,
          }}
          loop
          muted
          playsInline
          autoPlay
        />
      ) : hasAudio ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--spectrum-gray-100)",
            borderRadius: 8,
          }}
        >
          <svg
            style={{ width: 32, height: 32, color: "var(--spectrum-blue-700)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <span
            style={{
              fontSize: 10,
              color: "var(--spectrum-gray-600)",
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "90%",
            }}
          >
            {item.name ?? item.id}
          </span>
        </div>
      ) : hasImage ? (
        <>
          <img
            src={media!.url}
            alt={item.name ?? item.id}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
          <div
            style={{
              position: "absolute",
              insetInline: 0,
              bottom: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
              padding: 6,
              borderRadius: "0 0 8px 8px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "white",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
              }}
            >
              {item.name ?? item.id}
            </p>
          </div>
        </>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--spectrum-gray-100)",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--spectrum-gray-900)",
              textAlign: "center",
              lineHeight: 1.2,
              fontWeight: 500,
            }}
          >
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

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 100,
  };

  const burstStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "zoomFadeIn 0.3s ease-out",
  };

  const glowStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    filter: "blur(48px)",
    backgroundColor: "rgba(234, 179, 8, 0.3)",
    borderRadius: "50%",
    animation: "pulse 1s ease-in-out infinite",
  };

  const starStyle: React.CSSProperties = {
    fontSize: 64,
    animation: "bounce 1s ease infinite",
  };

  const floatingStyle = (particle: typeof CELEBRATION_PARTICLES[0]): React.CSSProperties => ({
    position: "absolute",
    left: particle.left,
    top: particle.top,
    fontSize: 24,
    animation: `float ${particle.animationDuration} ease-in-out infinite`,
    animationDelay: particle.animationDelay,
  });

  return (
    <div style={containerStyle}>
      {/* Burst effect */}
      <div style={burstStyle}>
        <div style={{ position: "relative" }}>
          {/* Glow */}
          <div style={glowStyle} />
          {/* Star burst */}
          <div style={starStyle}>
            ⭐
          </div>
        </div>
      </div>
      {/* Floating stars */}
      {CELEBRATION_PARTICLES.map((particle) => (
        <div
          key={particle.id}
          style={floatingStyle(particle)}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
};
