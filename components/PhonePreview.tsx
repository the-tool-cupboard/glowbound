import { ReactNode } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";

export const IPHONE_PREVIEW = {
  width: 390,
  height: 844,
  radius: 47,
  insetTop: 54,
  insetBottom: 28,
} as const;

interface PhonePreviewProps {
  children: ReactNode;
}

export function PhonePreview({ children }: PhonePreviewProps) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={[styles.stage, { minHeight: Dimensions.get("window").height }]}>
      <View style={styles.bezel}>
        <View style={styles.islandWrap} pointerEvents="none">
          <View style={styles.island} />
        </View>
        <View style={styles.screen}>
          <View style={styles.screenFill}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101218",
  },
  bezel: {
    width: IPHONE_PREVIEW.width + 18,
    height: IPHONE_PREVIEW.height + 18,
    borderRadius: IPHONE_PREVIEW.radius + 9,
    backgroundColor: "#0A0B0F",
    padding: 9,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
  },
  islandWrap: {
    position: "absolute",
    top: 18,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  island: {
    width: 118,
    height: 34,
    borderRadius: 20,
    backgroundColor: "#000",
  },
  screen: {
    width: IPHONE_PREVIEW.width,
    height: IPHONE_PREVIEW.height,
    borderRadius: IPHONE_PREVIEW.radius,
    overflow: "hidden",
    backgroundColor: "#0B1220",
  },
  screenFill: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
});
