import React from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Heading,
  Picker,
  PickerItem,
  Slider,
  Switch,
  Text,
  TextField,
} from "@react-spectrum/s2";

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

const CHROMA_COLORS: { value: ChromaKeyColor; label: string }[] = [
  { value: "none", label: "None" },
  { value: "green", label: "Green" },
  { value: "magenta", label: "Magenta" },
  { value: "blue", label: "Blue" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Heading level={3}>Presentation mode</Heading>
          <Text>Optimized for streaming & recording.</Text>
        </div>
        <Switch isSelected={isPresenting} onChange={() => onTogglePresentation()}>
          Enabled
        </Switch>
      </div>

      {isPresenting && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Heading level={4}>Background</Heading>
            <Picker
              label="Chroma key"
              selectedKey={chromaKey}
              onSelectionChange={(key) => onChromaKeyChange(key as ChromaKeyColor)}
            >
              {CHROMA_COLORS.map((c) => (
                <PickerItem key={c.value} id={c.value}>
                  {c.label}
                </PickerItem>
              ))}
            </Picker>

            <Slider
              label="Item size"
              minValue={0.75}
              maxValue={2}
              step={0.25}
              value={itemScale}
              onChange={onItemScaleChange}
              formatOptions={{ style: "percent" }}
            />

            <Switch isSelected={revealMode} onChange={onRevealModeChange}>
              Mystery reveal mode
            </Switch>
            <Switch isSelected={showProgress} onChange={onShowProgressChange}>
              Show progress bar
            </Switch>
            <Switch isSelected={celebrateSTier} onChange={onCelebrateSTierChange}>
              S-tier celebrations
            </Switch>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Heading level={4}>Item queue</Heading>
              {queueLength > 0 && (
                <Badge variant="informative" fillStyle="subtle">
                  {queueLength}
                </Badge>
              )}
            </div>

            <ButtonGroup>
              <Button variant="secondary" onPress={onStartQueue}>
                Start queue
              </Button>
              <Button
                variant="secondary"
                onPress={onShuffleQueue}
                isDisabled={queueLength === 0}
              >
                Shuffle
              </Button>
              <Button
                variant="accent"
                onPress={onDrawNext}
                isDisabled={queueLength === 0}
              >
                Draw next
              </Button>
            </ButtonGroup>

            {currentQueueItem && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Text>Now ranking</Text>
                <Text>{currentQueueItem}</Text>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Heading level={4}>Watermark</Heading>
              <Switch isSelected={showWatermark} onChange={onShowWatermarkChange}>
                Show
              </Switch>
            </div>
            <TextField
              label="Watermark text"
              value={watermarkText}
              onChange={onWatermarkTextChange}
              placeholder="@YourChannel"
              isDisabled={!showWatermark}
            />
          </div>
        </>
      )}
    </div>
  );
};
