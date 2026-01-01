/**
 * Surface Native Component
 * Provides consistent surface styling with optional glass effects
 *
 * Uses Skia for fixed-position glass (toolbars, headers)
 * Uses BlurView for glass over dynamic/scrollable content
 */
import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { palette, metrics, reanimatedSprings, reanimatedTiming } from "@tiercade/theme";
import { SkiaGlassBackground, GlassVariant } from "../SkiaGlass";

export type SurfaceVariant = "default" | "soft" | "elevated" | "glass" | "glass-strong" | "glass-light";
export type SurfaceSize = "sm" | "md" | "lg";

export interface SurfaceProps {
  /** Surface visual variant */
  variant?: SurfaceVariant;
  /** Padding size preset */
  size?: SurfaceSize;
  /** Border radius preset */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Whether this glass is over scrollable content (uses BlurView instead of Skia) */
  overScrollableContent?: boolean;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Whether surface is interactive (adds hover/press effects) */
  interactive?: boolean;
  /** Custom border color */
  borderColor?: string;
  /** Children */
  children?: React.ReactNode;
  /** Style override */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * Surface - A styled container component with glass effect support
 *
 * Variants:
 * - default: Standard surface background
 * - soft: Softer, lower contrast background
 * - elevated: Elevated with shadow
 * - glass: Glass-morphism effect (Skia for fixed, BlurView for scrollable)
 * - glass-strong: Stronger glass effect
 * - glass-light: Light glass effect
 */
export const Surface: React.FC<SurfaceProps> = ({
  variant = "default",
  size = "md",
  rounded = "md",
  overScrollableContent = false,
  animate = false,
  interactive = false,
  borderColor,
  children,
  style,
  testID,
}) => {
  // Track dimensions for glass effects
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Animation values
  const scale = useSharedValue(animate ? 0.95 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);
  const pressScale = useSharedValue(1);

  // Initialize mount animation
  React.useEffect(() => {
    if (animate) {
      scale.value = withSpring(1, reanimatedSprings.gentle);
      opacity.value = withTiming(1, { duration: reanimatedTiming.normal });
    }
  }, [animate, scale, opacity]);

  // Handle layout for glass dimensions
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  // Handle press states for interactive surfaces
  const handlePressIn = useCallback(() => {
    if (interactive) {
      pressScale.value = withSpring(0.98, reanimatedSprings.snappy);
    }
  }, [interactive, pressScale]);

  const handlePressOut = useCallback(() => {
    if (interactive) {
      pressScale.value = withSpring(1, reanimatedSprings.gentle);
    }
  }, [interactive, pressScale]);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value * pressScale.value },
    ],
  }));

  // Compute styles based on variant
  const containerStyle = getContainerStyle(variant, size, rounded, borderColor);
  const isGlass = variant.startsWith("glass");
  const glassVariant = getGlassVariant(variant);

  // Glass surfaces need special handling
  if (isGlass && dimensions.width > 0 && dimensions.height > 0) {
    // Use Skia for fixed-position glass
    if (!overScrollableContent) {
      return (
        <AnimatedView
          style={[containerStyle, animatedStyle, style]}
          onLayout={handleLayout}
          testID={testID}
          onTouchStart={handlePressIn}
          onTouchEnd={handlePressOut}
          onTouchCancel={handlePressOut}
        >
          <SkiaGlassBackground
            width={dimensions.width}
            height={dimensions.height}
            variant={glassVariant}
            borderRadius={getBorderRadius(rounded)}
          />
          <View style={styles.glassContent}>{children}</View>
        </AnimatedView>
      );
    }

    // Use BlurView for glass over scrollable content
    return (
      <AnimatedView
        style={[containerStyle, animatedStyle, style]}
        onLayout={handleLayout}
        testID={testID}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={getBlurAmount(variant)}
          reducedTransparencyFallbackColor={palette.surfaceElevated}
        />
        <View style={[styles.glassContent, styles.blurContent]}>{children}</View>
      </AnimatedView>
    );
  }

  // Non-glass surfaces or glass surfaces still measuring
  return (
    <AnimatedView
      style={[
        containerStyle,
        animatedStyle,
        isGlass && styles.glassFallback,
        style,
      ]}
      onLayout={handleLayout}
      testID={testID}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      {children}
    </AnimatedView>
  );
};

// Helper functions
function getContainerStyle(
  variant: SurfaceVariant,
  size: SurfaceSize,
  rounded: string,
  borderColor?: string
): ViewStyle {
  const padding = getPadding(size);
  const borderRadius = getBorderRadius(rounded);

  const base: ViewStyle = {
    padding,
    borderRadius,
    overflow: "hidden",
  };

  switch (variant) {
    case "soft":
      return {
        ...base,
        backgroundColor: palette.surfaceSoft,
        borderWidth: 1,
        borderColor: borderColor ?? palette.border,
      };
    case "elevated":
      return {
        ...base,
        backgroundColor: palette.surfaceElevated,
        borderWidth: 1,
        borderColor: borderColor ?? palette.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      };
    case "glass":
    case "glass-strong":
    case "glass-light":
      return {
        ...base,
        borderWidth: 1,
        borderColor: borderColor ?? "rgba(255, 255, 255, 0.08)",
      };
    case "default":
    default:
      return {
        ...base,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: borderColor ?? palette.border,
      };
  }
}

function getPadding(size: SurfaceSize): number {
  switch (size) {
    case "sm":
      return metrics.spacing.sm;
    case "lg":
      return metrics.spacing.xl;
    case "md":
    default:
      return metrics.spacing.md;
  }
}

function getBorderRadius(rounded: string): number {
  switch (rounded) {
    case "none":
      return metrics.radii.none;
    case "sm":
      return metrics.radii.sm;
    case "lg":
      return metrics.radii.lg;
    case "xl":
      return metrics.radii.xl;
    case "full":
      return metrics.radii.full;
    case "md":
    default:
      return metrics.radii.md;
  }
}

function getGlassVariant(variant: SurfaceVariant): GlassVariant {
  switch (variant) {
    case "glass-strong":
      return "strong";
    case "glass-light":
      return "light";
    case "glass":
    default:
      return "standard";
  }
}

function getBlurAmount(variant: SurfaceVariant): number {
  switch (variant) {
    case "glass-strong":
      return 20;
    case "glass-light":
      return 8;
    case "glass":
    default:
      return 12;
  }
}

const styles = StyleSheet.create({
  glassContent: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  blurContent: {
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  glassFallback: {
    backgroundColor: palette.surfaceElevated,
  },
});

export default Surface;
