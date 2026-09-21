import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageStyle,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { Image, type ImageProps } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import { IPHONE_PREVIEW } from "@/components/PhonePreview";
import { LoopingVideoBackground } from "@/components/LoopingVideoBackground";
import { theme } from "@/lib/theme";

interface ScreenMetrics {
  width: number;
  height: number;
}

const ScreenMetricsContext = createContext<ScreenMetrics | null>(null);

export function useScreenMetrics(): ScreenMetrics {
  const measured = useContext(ScreenMetricsContext);
  const windowSize = useWindowDimensions();

  if (measured && measured.width > 0 && measured.height > 0) {
    return measured;
  }

  return {
    width: windowSize.width,
    height: windowSize.height,
  };
}

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  backgroundSource?: ImageProps["source"];
  backgroundImageStyle?: ImageStyle;
  backgroundVideo?: number;
  playBackgroundVideo?: boolean;
}

export function ScreenContainer({
  children,
  style,
  backgroundSource,
  backgroundImageStyle,
  backgroundVideo,
  playBackgroundVideo = false,
}: ScreenContainerProps) {
  const [metrics, setMetrics] = useState<ScreenMetrics>({ width: 0, height: 0 });

  const onContentLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMetrics((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }
      return { width, height };
    });
  };

  const value = useMemo(() => metrics, [metrics]);
  const hasBackground = backgroundSource != null || (playBackgroundVideo && backgroundVideo != null);

  const content = (
    <ScreenMetricsContext.Provider value={value}>
      <View style={[styles.content, style]} onLayout={onContentLayout}>
        {children}
      </View>
    </ScreenMetricsContext.Provider>
  );

  const framed = Platform.OS === "web" ? (
    <View
      style={[
        styles.safeArea,
        styles.webInsets,
        hasBackground && styles.transparentFill,
      ]}
    >
      {content}
    </View>
  ) : (
    <SafeAreaView
      style={[styles.safeArea, hasBackground && styles.transparentFill]}
      edges={["top", "right", "bottom", "left"]}
    >
      {content}
    </SafeAreaView>
  );

  if (!hasBackground) {
    return framed;
  }

  return (
    <View style={styles.backgroundWrap}>
      {backgroundSource != null ? (
        <Image
          source={backgroundSource}
          style={[
            styles.backgroundImage,
            backgroundImageStyle ?? styles.backgroundImageFill,
          ]}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          accessible={false}
        />
      ) : null}
      {playBackgroundVideo && backgroundVideo != null ? (
        <LoopingVideoBackground source={backgroundVideo} playing />
      ) : null}
      {framed}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundWrap: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    backgroundColor: theme.colors.background,
  },
  backgroundImage: {
    zIndex: 0,
    pointerEvents: "none",
  },
  backgroundImageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    zIndex: 1,
    backgroundColor: theme.colors.background,
  },
  transparentFill: {
    backgroundColor: "transparent",
  },
  webInsets: {
    paddingTop: IPHONE_PREVIEW.insetTop,
    paddingBottom: IPHONE_PREVIEW.insetBottom,
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
});
