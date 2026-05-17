import React from "react";
import { EFFECTS } from "@tiercade/theme";

const CELEBRATION_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5) % 100}%`,
  top: `${((i * 7) + 10) % 100}%`,
  duration: 1 + (i % 3) * 0.3,
  delay: (i % 5) * 0.1,
  emoji: ["⭐", "✨", "🌟"][i % 3],
}));

interface CelebrationEffectProps {
  onComplete: () => void;
}

/**
 * Full-screen celebration overlay shown when an item is moved to an S-tier
 * in presentation mode. Self-contained: only prop is onComplete callback.
 * Auto-dismisses after EFFECTS.CELEBRATION_DURATION ms.
 */
export const CelebrationEffect: React.FC<CelebrationEffectProps> = React.memo(
  ({ onComplete }) => {
    React.useEffect(() => {
      const timer = setTimeout(onComplete, EFFECTS.CELEBRATION_DURATION);
      return () => clearTimeout(timer);
    }, [onComplete]);

    return (
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              inset: 0,
              filter: "blur(48px)",
              backgroundColor: "rgba(234, 179, 8, 0.3)",
              borderRadius: "50%"
            }} />
            <div style={{ fontSize: 48, animation: "bounce 1s infinite" }}>⭐</div>
          </div>
        </div>
        {CELEBRATION_PARTICLES.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              fontSize: 24,
              left: particle.left,
              top: particle.top,
              animation: `confetti ${particle.duration}s ease-out forwards`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>
    );
  }
);

CelebrationEffect.displayName = "CelebrationEffect";
