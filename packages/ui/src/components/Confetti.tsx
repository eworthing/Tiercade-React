import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocity: { x: number; y: number };
  type: "confetti" | "sparkle";
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
  colors?: string[];
}

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#14b8a6", // teal
];

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  onComplete,
  particleCount = 50,
  duration = 2000,
  colors = COLORS,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const velocity = 8 + Math.random() * 8;
      const isSparkle = Math.random() > 0.7;

      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity - 5, // Initial upward boost
        },
        type: isSparkle ? "sparkle" : "confetti",
      });
    }

    setParticles(newParticles);
  }, [particleCount, colors]);

  useEffect(() => {
    if (active) {
      createParticles();

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active, createParticles, duration, onComplete]);

  if (!active && particles.length === 0) return null;

  return createPortal(
    <div className="celebration-container" aria-hidden="true">
      {particles.map((particle) => (
        <ParticleElement key={particle.id} particle={particle} duration={duration} />
      ))}
    </div>,
    document.body
  );
};

const ParticleElement: React.FC<{ particle: Particle; duration: number }> = ({
  particle,
  duration,
}) => {
  const [position, setPosition] = useState({ x: particle.x, y: particle.y });
  const [opacity, setOpacity] = useState(1);
  const [rotation, setRotation] = useState(particle.rotation);

  useEffect(() => {
    let frame: number;
    let velocity = { ...particle.velocity };
    const gravity = 0.3;
    const friction = 0.99;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        return;
      }

      velocity.y += gravity;
      velocity.x *= friction;
      velocity.y *= friction;

      setPosition((prev) => ({
        x: prev.x + velocity.x,
        y: prev.y + velocity.y,
      }));

      setRotation((prev) => prev + velocity.x * 2);
      setOpacity(1 - progress);

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [particle, duration]);

  if (particle.type === "sparkle") {
    return (
      <svg
        className="absolute pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${particle.scale})`,
          opacity,
          transition: "opacity 0.1s ease-out",
        }}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill={particle.color}
      >
        <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z" />
      </svg>
    );
  }

  return (
    <div
      className="absolute pointer-events-none rounded-sm"
      style={{
        left: position.x,
        top: position.y,
        width: 10 * particle.scale,
        height: 6 * particle.scale,
        backgroundColor: particle.color,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        opacity,
        transition: "opacity 0.1s ease-out",
      }}
    />
  );
};

// Success checkmark with celebration animation
export const SuccessAnimation: React.FC<{ show: boolean; onComplete?: () => void }> = ({
  show,
  onComplete,
}) => {
  const [phase, setPhase] = useState<"idle" | "check" | "confetti">("idle");

  useEffect(() => {
    if (show) {
      setPhase("check");
      const timer = setTimeout(() => {
        setPhase("confetti");
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPhase("idle");
    }
  }, [show]);

  if (!show && phase === "idle") return null;

  return (
    <>
      {/* Checkmark overlay */}
      {phase !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className={`
              w-20 h-20 rounded-full bg-success flex items-center justify-center
              shadow-glow-success
              ${phase === "check" || phase === "confetti" ? "animate-success-check" : "opacity-0 scale-0"}
            `}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Confetti burst */}
      <Confetti
        active={phase === "confetti"}
        onComplete={() => {
          setPhase("idle");
          onComplete?.();
        }}
        particleCount={40}
        duration={1500}
      />
    </>
  );
};
