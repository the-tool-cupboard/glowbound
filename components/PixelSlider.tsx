import { useCallback, useMemo, useRef } from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type DimensionValue,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";

import { theme } from "@/lib/theme";

const STEP_COUNT = theme.pixel.step;
const PREVIEW_THROTTLE_MS = 160;
const SLIDER_MIN_HIT = 44;
const BLOCK_HEIGHT = 16;
const THUMB_SIZE = 3;

interface PixelSliderProps {
  value: number;
  accessibilityLabel: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  onDragPreview?: () => void;
}

export function quantizeVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const clamped = Math.min(1, Math.max(0, value));
  return Math.round(clamped * STEP_COUNT) / STEP_COUNT;
}

function volumeToStep(value: number): number {
  return Math.round(quantizeVolume(value) * STEP_COUNT);
}

export function PixelSlider({
  value,
  accessibilityLabel,
  disabled = false,
  onChange,
  onDragPreview,
}: PixelSliderProps) {
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const trackMeasuredRef = useRef(false);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onDragPreviewRef = useRef(onDragPreview);
  const lastPreviewAtRef = useRef(0);
  const lastPreviewStepRef = useRef(-1);

  valueRef.current = value;
  onChangeRef.current = onChange;
  onDragPreviewRef.current = onDragPreview;

  const step = volumeToStep(value);

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      trackWidthRef.current = width;
      trackMeasuredRef.current = width > 0;
    });
  }, []);

  const maybePreview = useCallback((nextValue: number) => {
    const preview = onDragPreviewRef.current;
    if (preview == null) {
      return;
    }
    const nextStep = volumeToStep(nextValue);
    const now = Date.now();
    if (nextStep === lastPreviewStepRef.current) {
      return;
    }
    if (now - lastPreviewAtRef.current < PREVIEW_THROTTLE_MS) {
      return;
    }
    lastPreviewStepRef.current = nextStep;
    lastPreviewAtRef.current = now;
    preview();
  }, []);

  const applyRatio = useCallback(
    (ratio: number) => {
      const next = quantizeVolume(ratio);
      if (next === quantizeVolume(valueRef.current)) {
        return;
      }
      onChangeRef.current(next);
      maybePreview(next);
    },
    [maybePreview]
  );

  const applyPageX = useCallback(
    (pageX: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) {
        return;
      }
      applyRatio((pageX - trackPageXRef.current) / width);
    },
    [applyRatio]
  );

  const handleGrantOrMove = useCallback(
    (event: GestureResponderEvent) => {
      const pageX = event.nativeEvent.pageX;
      if (trackMeasuredRef.current && trackWidthRef.current > 0) {
        applyPageX(pageX);
      }
      trackRef.current?.measureInWindow((x, _y, width) => {
        trackPageXRef.current = x;
        trackWidthRef.current = width;
        trackMeasuredRef.current = width > 0;
        applyPageX(pageX);
      });
    },
    [applyPageX]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: handleGrantOrMove,
        onPanResponderMove: handleGrantOrMove,
      }),
    [disabled, handleGrantOrMove]
  );

  const handleLayout = (_event: LayoutChangeEvent) => {
    measureTrack();
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled) {
      return;
    }
    const increment = 1 / STEP_COUNT;
    if (event.nativeEvent.actionName === "increment") {
      const next = quantizeVolume(value + increment);
      onChange(next);
      maybePreview(next);
      return;
    }
    if (event.nativeEvent.actionName === "decrement") {
      const next = quantizeVolume(value - increment);
      onChange(next);
      maybePreview(next);
    }
  };

  return (
    <View
      ref={trackRef}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: 0, max: STEP_COUNT, now: step }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={handleAccessibilityAction}
      onLayout={handleLayout}
      pointerEvents={disabled ? "none" : "auto"}
      style={[styles.hit, disabled && styles.disabled]}
      {...panResponder.panHandlers}
    >
      <View style={styles.frame} pointerEvents="none">
        <View style={styles.well}>
          {Array.from({ length: STEP_COUNT }, (_, index) => {
            const lit = index < step;
            return (
              <View key={index} style={[styles.block, lit ? styles.blockLit : styles.blockIdle]}>
                {lit ? (
                  <>
                    <View style={styles.blockHighlight} />
                    <View style={styles.blockShade} />
                  </>
                ) : null}
              </View>
            );
          })}
          <View
            style={[
              styles.thumb,
              {
                left: thumbOffset(step),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function thumbOffset(step: number): DimensionValue {
  if (STEP_COUNT <= 0) {
    return "0%";
  }
  const percent = Math.min(100, Math.max(0, (step / STEP_COUNT) * 100));
  return `${percent}%`;
}

const styles = StyleSheet.create({
  hit: {
    flex: 1,
    minHeight: SLIDER_MIN_HIT,
    minWidth: 88,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  frame: {
    minHeight: BLOCK_HEIGHT + theme.pixel.outline * 2 + theme.pixel.inset * 2,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.pixel,
    padding: theme.pixel.inset,
    justifyContent: "center",
  },
  well: {
    height: BLOCK_HEIGHT,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 2,
    position: "relative",
  },
  block: {
    flex: 1,
    borderRadius: 0,
    overflow: "hidden",
  },
  blockLit: {
    backgroundColor: theme.colors.accent,
  },
  blockIdle: {
    backgroundColor: theme.colors.idle,
  },
  blockHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.button3d.highlight,
  },
  blockShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: theme.pixel.shade,
    backgroundColor: theme.button3d.shade,
  },
  thumb: {
    position: "absolute",
    top: -1,
    width: THUMB_SIZE,
    height: BLOCK_HEIGHT + 2,
    marginLeft: -Math.floor(THUMB_SIZE / 2),
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.button3d.rim,
    borderRadius: 0,
  },
});
