import React from "react";

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
  return (
    <div className="space-y-4">
      {/* Main toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Presentation Mode</h3>
          <p className="text-xs text-text-muted">Optimized for streaming & recording</p>
        </div>
        <button
          onClick={onTogglePresentation}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isPresenting ? "bg-accent" : "bg-surface-raised"
          }`}
          role="switch"
          aria-checked={isPresenting}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              isPresenting ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {isPresenting && (
        <>
          <div className="border-t border-border pt-4 space-y-4">
            {/* Chroma Key */}
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Chroma Key Background
              </label>
              <div className="flex gap-2 mt-2">
                {CHROMA_COLORS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => onChromaKeyChange(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-button border transition-all ${
                      chromaKey === value
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-surface-raised border-border text-text-muted hover:border-text-subtle"
                    }`}
                  >
                    {value !== "none" && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Scale */}
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Item Size: {Math.round(itemScale * 100)}%
              </label>
              <input
                type="range"
                min="0.75"
                max="2"
                step="0.25"
                value={itemScale}
                onChange={(e) => onItemScaleChange(parseFloat(e.target.value))}
                className="w-full mt-2 accent-accent"
              />
            </div>

            {/* Reveal Mode */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-text">Mystery Reveal Mode</span>
                <p className="text-xs text-text-muted">Items hidden until clicked</p>
              </div>
              <button
                onClick={() => onRevealModeChange(!revealMode)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  revealMode ? "bg-accent" : "bg-surface-raised"
                }`}
                role="switch"
                aria-checked={revealMode}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    revealMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Show Progress Bar</span>
              <button
                onClick={() => onShowProgressChange(!showProgress)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  showProgress ? "bg-accent" : "bg-surface-raised"
                }`}
                role="switch"
                aria-checked={showProgress}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    showProgress ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Celebrate S-Tier */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-text">S-Tier Celebrations</span>
                <p className="text-xs text-text-muted">Confetti for top tier</p>
              </div>
              <button
                onClick={() => onCelebrateSTierChange(!celebrateSTier)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  celebrateSTier ? "bg-accent" : "bg-surface-raised"
                }`}
                role="switch"
                aria-checked={celebrateSTier}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    celebrateSTier ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Queue Controls */}
          <div className="border-t border-border pt-4">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Item Queue
            </label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={onStartQueue}
                className="flex-1 px-3 py-2 text-sm rounded-button bg-surface-raised border border-border text-text hover:border-text-subtle transition-all"
              >
                Start Queue
              </button>
              <button
                onClick={onShuffleQueue}
                disabled={queueLength === 0}
                className="px-3 py-2 text-sm rounded-button bg-surface-raised border border-border text-text hover:border-text-subtle transition-all disabled:opacity-50"
              >
                Shuffle
              </button>
            </div>
            {queueLength > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {queueLength} items in queue
                </span>
                <button
                  onClick={onDrawNext}
                  className="px-3 py-1.5 text-xs font-medium rounded-button bg-accent text-white hover:bg-accent/90 transition-all"
                >
                  Draw Next
                </button>
              </div>
            )}
            {currentQueueItem && (
              <div className="mt-2 p-2 bg-accent/10 rounded-card border border-accent/20">
                <span className="text-xs text-text-muted">Now ranking:</span>
                <p className="text-sm font-medium text-accent truncate">
                  {currentQueueItem}
                </p>
              </div>
            )}
          </div>

          {/* Watermark */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Watermark
              </label>
              <button
                onClick={() => onShowWatermarkChange(!showWatermark)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  showWatermark ? "bg-accent" : "bg-surface-raised"
                }`}
                role="switch"
                aria-checked={showWatermark}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    showWatermark ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => onWatermarkTextChange(e.target.value)}
              placeholder="@YourChannel"
              className="w-full px-3 py-1.5 text-sm rounded-button bg-surface-raised border border-border text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </>
      )}
    </div>
  );
};
