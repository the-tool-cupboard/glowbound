import { useCallback, useState, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { theme } from "@/lib/theme";

interface ShopStallGridProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function ShopStallGrid({ children, footer }: ShopStallGridProps) {
  const [viewportHeight, setViewportHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setViewportHeight((current) => (current === next ? current : next));
  }, []);

  return (
    <View style={styles.stall} onLayout={onLayout}>
      <ScrollView
        style={[styles.scroller, viewportHeight > 0 ? { height: viewportHeight } : null]}
        contentContainerStyle={styles.stallContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View pointerEvents="box-none" style={styles.plate}>
          <View style={styles.shelf}>{children}</View>
          {footer}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stall: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflow: "hidden",
  },
  scroller: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
    width: "100%",
  },
  stallContent: {
    flexGrow: 1,
    width: "100%",
    justifyContent: "center",
    paddingBottom: theme.spacing.lg,
  },
  plate: {
    width: "100%",
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.stallRim,
    padding: theme.stallPlate.padding,
    gap: theme.spacing.sm,
  },
  shelf: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
