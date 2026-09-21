import { StyleSheet, Text, View } from "react-native";

import { PathLanternMark } from "@/components/PathLanternMark";
import { lanternShareCopy, lanternShareTitle } from "@/lib/nightLantern";
import { theme } from "@/lib/theme";

interface LanternShareCardProps {
  patternsCleared: number;
  chapterTitle: string;
  streak: number;
  stars: number;
}

function starGlyphs(stars: number): string {
  const lit = Math.max(0, Math.min(3, Math.floor(stars)));
  return `${"★".repeat(lit)}${"☆".repeat(3 - lit)}`;
}

export function LanternShareCard({
  patternsCleared,
  chapterTitle,
  streak,
  stars,
}: LanternShareCardProps) {
  const title = lanternShareTitle(streak);
  const copy = lanternShareCopy({ patternsCleared, chapterTitle, streak });

  return (
    <View accessible accessibilityLabel={`${title}. ${copy}. ${starGlyphs(stars)}`} style={styles.card}>
      <View style={styles.pixelHilite} />
      <View style={styles.row}>
        <View style={styles.mark}>
          <PathLanternMark pathId="standard" selected size={48} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.label}>
            {title}
          </Text>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.chapter}>
            {chapterTitle}
          </Text>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.stars}>
            {starGlyphs(stars)}
          </Text>
        </View>
      </View>
      <Text numberOfLines={3} maxFontSizeMultiplier={1.2} style={styles.body}>
        {copy}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.stallRim,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.stallPlate.padding,
    gap: theme.spacing.sm,
    overflow: "hidden",
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: "rgba(196, 184, 150, 0.16)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.path.standard.rim,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.path.standard.well,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    color: theme.colors.accent,
    ...theme.typography.overline,
  },
  chapter: {
    color: theme.colors.text,
    ...theme.typography.heading,
    fontSize: 18,
    lineHeight: 22,
  },
  stars: {
    color: theme.colors.accent,
    ...theme.typography.caption,
    letterSpacing: 2,
  },
  body: {
    color: theme.colors.text,
    ...theme.typography.caption,
  },
});
