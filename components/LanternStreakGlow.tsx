import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { theme } from "@/lib/theme";

const MOTES = [
  { left: 10, delay: 0, duration: 2200, size: 3 },
  { left: 22, delay: 400, duration: 2600, size: 2 },
  { left: 34, delay: 900, duration: 2000, size: 3 },
  { left: 18, delay: 1400, duration: 2400, size: 2 },
  { left: 28, delay: 1800, duration: 2100, size: 2 },
] as const;

interface LanternStreakGlowProps {
  active: boolean;
  animate: boolean;
}

function EmberMote({
  left,
  delay,
  duration,
  size,
  animate,
}: {
  left: number;
  delay: number;
  duration: number;
  size: number;
  animate: boolean;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(animate ? 0 : 0.35)).current;

  useEffect(() => {
    if (!animate) {
      y.setValue(-8);
      opacity.setValue(0.35);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -26,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: Math.floor(duration * 0.28),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: Math.floor(duration * 0.72),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(y, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [animate, delay, duration, opacity, y]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          left,
          width: size,
          height: size,
          opacity,
          transform: [{ translateY: y }],
        },
      ]}
    />
  );
}

export function LanternStreakGlow({ active, animate }: LanternStreakGlowProps) {
  const motes = useMemo(() => MOTES, []);

  if (!active) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden>
      <View style={styles.halo} />
      <View style={styles.core} />
      {motes.map((mote) => (
        <EmberMote key={`${mote.left}-${mote.delay}`} animate={animate} {...mote} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 8,
    top: 4,
    width: 72,
    height: 72,
  },
  halo: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 64,
    height: 64,
    borderRadius: theme.radius.pixel,
    backgroundColor: "rgba(230, 195, 92, 0.16)",
  },
  core: {
    position: "absolute",
    left: 14,
    top: 14,
    width: 44,
    height: 44,
    borderRadius: theme.radius.pixel,
    backgroundColor: "rgba(255, 224, 138, 0.12)",
  },
  mote: {
    position: "absolute",
    bottom: 18,
    backgroundColor: theme.colors.accent,
  },
});
