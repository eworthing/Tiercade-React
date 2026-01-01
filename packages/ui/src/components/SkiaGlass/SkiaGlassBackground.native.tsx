/**
 * SkiaGlassBackground - Skia-based glass effect component
 *
 * IMPORTANT LIMITATION: Skia glass effects only work for:
 * - Static backgrounds
 * - Content rendered INSIDE the Canvas
 *
 * This component CANNOT blur native RN views beneath it.
 * For blur over scrollable RN content, use BlurView from @react-native-community/blur instead.
 */
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import {
  Canvas,
  Fill,
  Blur,
  RoundedRect,
  Group,
  LinearGradient,
  vec,
  Paint,
} from "@shopify/react-native-skia";
import { glassEffects, GlassEffect } from "@tiercade/theme";

export type GlassVariant = "standard" | "strong" | "light";

export interface SkiaGlassBackgroundProps {
  /** Width of the glass effect area */
  width: number;
  /** Height of the glass effect area */
  height: number;
  /** Glass effect variant */
  variant?: GlassVariant;
  /** Border radius (defaults to 16) */
  borderRadius?: number;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Custom blur radius (overrides variant) */
  blurRadius?: number;
  /** Custom border color (overrides variant) */
  borderColor?: string;
  /** Custom border width (overrides variant) */
  borderWidth?: number;
  /** Style for the container */
  style?: ViewStyle;
}

/**
 * SkiaGlassBackground creates a glass-morphism effect using Skia Canvas.
 *
 * Use this for:
 * - Toolbars and headers (fixed position)
 * - Modal backgrounds
 * - Card overlays on static backgrounds
 *
 * DO NOT use for:
 * - Glass effects over scrollable content (use BlurView instead)
 * - Backdrop-filter style blur on dynamic content
 */
export const SkiaGlassBackground: React.FC<SkiaGlassBackgroundProps> = ({
  width,
  height,
  variant = "standard",
  borderRadius = 16,
  backgroundColor,
  blurRadius,
  borderColor,
  borderWidth,
  style,
}) => {
  // Get effect config from theme, with optional overrides
  const effect: GlassEffect = glassEffects[variant];
  const bgColor = backgroundColor ?? effect.backgroundColor;
  const blur = blurRadius ?? effect.blurRadius;
  const border = borderColor ?? effect.borderColor;
  const borderW = borderWidth ?? effect.borderWidth;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Canvas style={[styles.canvas, { width, height }]}>
        <Group>
          {/* Base fill with glass color */}
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={borderRadius}
            color={bgColor}
          />

          {/* Subtle gradient overlay for depth */}
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={borderRadius}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[
                "rgba(255, 255, 255, 0.08)",
                "rgba(255, 255, 255, 0.02)",
                "rgba(0, 0, 0, 0.05)",
              ]}
              positions={[0, 0.5, 1]}
            />
          </RoundedRect>

          {/* Border highlight */}
          <RoundedRect
            x={borderW / 2}
            y={borderW / 2}
            width={width - borderW}
            height={height - borderW}
            r={borderRadius - borderW / 2}
            color="transparent"
            style="stroke"
            strokeWidth={borderW}
          >
            <Paint color={border} />
          </RoundedRect>

          {/* Apply blur to the entire group */}
          <Blur blur={blur / 4} />
        </Group>
      </Canvas>
    </View>
  );
};

/**
 * SkiaGlassOverlay - Full-screen glass overlay for modals
 */
export interface SkiaGlassOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Opacity of the overlay (0-1) */
  opacity?: number;
  /** Children to render on top of the glass */
  children?: React.ReactNode;
}

export const SkiaGlassOverlay: React.FC<SkiaGlassOverlayProps> = ({
  visible,
  opacity = 0.8,
  children,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={`rgba(2, 6, 23, ${opacity})`} />
        <Blur blur={8} />
      </Canvas>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    overflow: "hidden",
  },
  canvas: {
    position: "absolute",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SkiaGlassBackground;
