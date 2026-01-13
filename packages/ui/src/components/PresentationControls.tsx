import React, { useState } from "react";

export type ChromaKeyColor = "none" | "green" | "magenta" | "blue";

export interface PresentationControlsProps {
  isPresenting: boolean;
  chromaKey: ChromaKeyColor;
  revealMode: boolean;
  showProgress: boolean;
  celebrateSTier: boolean;
  itemScale: number;
  queueLength: number;
  currentQueueItem: string | null;
  watermarkText: string;
  showWatermark: boolean;
  onTogglePresentation: () => void;
  onChromaKeyChange: (color: ChromaKeyColor) => void;
  onRevealModeChange: (enabled: boolean) => void;
  onShowProgressChange: (show: boolean) => void;
  onCelebrateSTierChange: (celebrate: boolean) => void;
  onItemScaleChange: (scale: number) => void;
  onDrawNext: () => void;
  onShuffleQueue: () => void;
  onStartQueue: () => void;
  onWatermarkTextChange: (text: string) => void;
  onShowWatermarkChange: (show: boolean) => void;
}

const CHROMA_COLORS: { value: ChromaKeyColor; label: string; color: string }[] = [
  { value: "none", label: "None", color: "transparent" },
  { value: "green", label: "Green", color: "#00ff00" },
  { value: "magenta", label: "Magenta", color: "#ff00ff" },
  { value: "blue", label: "Blue", color: "#0000ff" },
];

export const PresentationControls: React.FC<PresentationControlsProps> = ({
  isPresenting,
  chromaKey,
  revealMode,
  showProgress,
  celebrateSTier,
  itemScale,
  queueLength,
  currentQueueItem,
  watermarkText,
  showWatermark,
  onTogglePresentation,
  onChromaKeyChange,
  onRevealModeChange,
  onShowProgressChange,
  onCelebrateSTierChange,
  onItemScaleChange,
  onDrawNext,
  onShuffleQueue,
  onStartQueue,
  onWatermarkTextChange,
  onShowWatermarkChange,
}) => {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const labelGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--spectrum-gray-900)",
  };

  const descStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--spectrum-gray-600)",
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: "var(--spectrum-gray-600)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const sectionStyle: React.CSSProperties = {
    borderTop: "1px solid var(--spectrum-gray-300)",
    paddingTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    marginTop: 8,
  };

  return (
    <div style={containerStyle}>
      {/* Main toggle */}
      <div style={rowStyle}>
        <div>
          <h3 style={titleStyle}>Presentation Mode</h3>
          <p style={descStyle}>Optimized for streaming & recording</p>
        </div>
        <ToggleSwitch
          checked={isPresenting}
          onChange={onTogglePresentation}
          size="large"
        />
      </div>

      {isPresenting && (
        <>
          <div style={sectionStyle}>
            {/* Chroma Key */}
            <div>
              <label style={sectionLabelStyle}>
                Chroma Key Background
              </label>
              <div style={buttonGroupStyle}>
                {CHROMA_COLORS.map(({ value, label, color }) => (
                  <ChromaButton
                    key={value}
                    value={value}
                    label={label}
                    color={color}
                    isActive={chromaKey === value}
                    onClick={() => onChromaKeyChange(value)}
                  />
                ))}
              </div>
            </div>

            {/* Item Scale */}
            <div>
              <label style={sectionLabelStyle}>
                Item Size: {Math.round(itemScale * 100)}%
              </label>
              <input
                type="range"
                min="0.75"
                max="2"
                step="0.25"
                value={itemScale}
                onChange={(e) => onItemScaleChange(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  marginTop: 8,
                  accentColor: "var(--spectrum-blue-700)",
                }}
              />
            </div>

            {/* Reveal Mode */}
            <div style={rowStyle}>
              <div>
                <span style={{ fontSize: 14, color: "var(--spectrum-gray-900)" }}>Mystery Reveal Mode</span>
                <p style={descStyle}>Items hidden until clicked</p>
              </div>
              <ToggleSwitch checked={revealMode} onChange={() => onRevealModeChange(!revealMode)} />
            </div>

            {/* Progress Bar */}
            <div style={rowStyle}>
              <span style={{ fontSize: 14, color: "var(--spectrum-gray-900)" }}>Show Progress Bar</span>
              <ToggleSwitch checked={showProgress} onChange={() => onShowProgressChange(!showProgress)} />
            </div>

            {/* Celebrate S-Tier */}
            <div style={rowStyle}>
              <div>
                <span style={{ fontSize: 14, color: "var(--spectrum-gray-900)" }}>S-Tier Celebrations</span>
                <p style={descStyle}>Confetti for top tier</p>
              </div>
              <ToggleSwitch checked={celebrateSTier} onChange={() => onCelebrateSTierChange(!celebrateSTier)} />
            </div>
          </div>

          {/* Queue Controls */}
          <div style={sectionStyle}>
            <label style={sectionLabelStyle}>
              Item Queue
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <ActionButton onClick={onStartQueue} style={{ flex: 1 }}>
                Start Queue
              </ActionButton>
              <ActionButton onClick={onShuffleQueue} disabled={queueLength === 0}>
                Shuffle
              </ActionButton>
            </div>
            {queueLength > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--spectrum-gray-600)" }}>
                  {queueLength} items in queue
                </span>
                <button
                  onClick={onDrawNext}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    backgroundColor: "var(--spectrum-blue-700)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  Draw Next
                </button>
              </div>
            )}
            {currentQueueItem && (
              <div
                style={{
                  padding: 8,
                  backgroundColor: "rgba(var(--spectrum-blue-900-rgb, 20, 115, 230), 0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(var(--spectrum-blue-900-rgb, 20, 115, 230), 0.2)",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--spectrum-gray-600)" }}>Now ranking:</span>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--spectrum-blue-700)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentQueueItem}
                </p>
              </div>
            )}
          </div>

          {/* Watermark */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={sectionLabelStyle}>
                Watermark
              </label>
              <ToggleSwitch checked={showWatermark} onChange={() => onShowWatermarkChange(!showWatermark)} />
            </div>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => onWatermarkTextChange(e.target.value)}
              placeholder="@YourChannel"
              style={{
                width: "100%",
                padding: "6px 12px",
                fontSize: 14,
                borderRadius: 6,
                backgroundColor: "var(--spectrum-gray-100)",
                border: "1px solid var(--spectrum-gray-300)",
                color: "var(--spectrum-gray-900)",
                outline: "none",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

// Toggle switch component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  size?: "small" | "large";
}> = ({ checked, onChange, size = "small" }) => {
  const isLarge = size === "large";
  const trackWidth = isLarge ? 48 : 40;
  const trackHeight = isLarge ? 24 : 20;
  const thumbSize = isLarge ? 16 : 16;
  const thumbOffset = isLarge ? 4 : 2;

  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        position: "relative",
        width: trackWidth,
        height: trackHeight,
        borderRadius: 9999,
        backgroundColor: checked ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-300)",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: thumbOffset,
          width: thumbSize,
          height: thumbSize,
          borderRadius: "50%",
          backgroundColor: "white",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          transition: "transform 0.15s ease",
          transform: checked
            ? `translateX(${trackWidth - thumbSize - thumbOffset * 2}px)`
            : `translateX(${thumbOffset}px)`,
        }}
      />
    </button>
  );
};

// Chroma button component
const ChromaButton: React.FC<{
  value: ChromaKeyColor;
  label: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ value, label, color, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        fontSize: 12,
        borderRadius: 6,
        border: "1px solid",
        cursor: "pointer",
        transition: "all 0.15s ease",
        backgroundColor: isActive
          ? "rgba(var(--spectrum-blue-900-rgb, 20, 115, 230), 0.1)"
          : "var(--spectrum-gray-100)",
        borderColor: isActive
          ? "var(--spectrum-blue-700)"
          : isHovered
          ? "var(--spectrum-gray-500)"
          : "var(--spectrum-gray-300)",
        color: isActive ? "var(--spectrum-blue-700)" : "var(--spectrum-gray-600)",
      }}
    >
      {value !== "none" && (
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "1px solid rgba(0, 0, 0, 0.2)",
            backgroundColor: color,
          }}
        />
      )}
      {label}
    </button>
  );
};

// Action button component
const ActionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ onClick, disabled, style, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: "8px 12px",
        fontSize: 14,
        borderRadius: 6,
        backgroundColor: "var(--spectrum-gray-100)",
        border: "1px solid",
        borderColor: isHovered && !disabled ? "var(--spectrum-gray-500)" : "var(--spectrum-gray-300)",
        color: "var(--spectrum-gray-900)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
};
