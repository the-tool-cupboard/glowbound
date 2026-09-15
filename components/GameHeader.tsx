import { Pressable, StyleSheet, Text, View } from "react-native";

import { CampMark } from "@/components/CampMark";
import { useGameAudio } from "@/hooks/useGameAudio";
import { theme } from "@/lib/theme";

interface GameHeaderProps {
  level: number;
  score: number;
  stage?: number;
  stagesRequired?: number;
  onArt?: boolean;
  onReturnToCamp: () => void;
}

export function GameHeader({
  level,
  score,
  stage,
  stagesRequired,
  onArt = false,
  onReturnToCamp,
}: GameHeaderProps) {
  const stageLabel =
    stage != null && stagesRequired != null ? `Pattern ${stage} of ${stagesRequired}` : null;
  const artStyle = onArt ? styles.onArt : undefined;
  const { playSfx } = useGameAudio();

  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={styles.side}>
        <Text style={[styles.label, artStyle]}>Level</Text>
        <Text
          style={[styles.value, artStyle]}
          accessibilityLabel={`Level ${level}${stageLabel ? `, ${stageLabel}` : ""}`}
        >
          {level}
        </Text>
      </View>
      <View style={styles.center}>
        {stageLabel ? (
          <Text style={[styles.stage, artStyle]} accessibilityElementsHidden>
            {stageLabel}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.scoreSide]}>
        <Text style={[styles.label, styles.alignRight, artStyle]}>Score</Text>
        <Text style={[styles.value, styles.alignRight, artStyle]} accessibilityLabel={`Score ${score}`}>
          {score}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return to camp"
        accessibilityHint="Returns to the start menu at camp"
        hitSlop={theme.hitSlop}
        onPress={() => {
          playSfx("uiTap");
          onReturnToCamp();
        }}
        style={({ pressed }) => [styles.campHit, pressed && styles.campPressed]}
      >
        {({ pressed }) => (
          <View style={[styles.campFace, pressed && styles.campFacePressed]}>
            <View style={[styles.campHilite, pressed && styles.campHilitePressed]} />
            <CampMark />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: theme.spacing.xs,
  },
  side: {
    flex: 1,
    minWidth: 56,
  },
  scoreSide: {
    flexShrink: 1,
  },
  center: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: theme.colors.accent,
    marginBottom: 4,
    ...theme.typography.overline,
  },
  value: {
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    ...theme.typography.score,
  },
  alignRight: {
    textAlign: "right",
  },
  stage: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
    fontWeight: "600",
  },
  onArt: {
    ...theme.artTextShadow,
  },
  campHit: {
    width: theme.minTapTarget,
    height: theme.minTapTarget,
    minWidth: theme.minTapTarget,
    minHeight: theme.minTapTarget,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    overflow: "hidden",
  },
  campPressed: {
    transform: [{ translateY: theme.pixel.inset }],
  },
  campFace: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.button3d.ghostFace,
    borderWidth: theme.pixel.inset,
    borderTopColor: theme.button3d.ghostRimHighlight,
    borderLeftColor: theme.button3d.ghostRimHighlight,
    borderBottomColor: theme.button3d.ghostRimShade,
    borderRightColor: theme.button3d.ghostRimShade,
    overflow: "hidden",
  },
  campFacePressed: {
    paddingTop: theme.pixel.inset,
    borderTopColor: theme.button3d.ghostRimShade,
    borderLeftColor: theme.button3d.ghostRimShade,
  },
  campHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: theme.button3d.highlight,
  },
  campHilitePressed: {
    backgroundColor: theme.button3d.shade,
    opacity: 0.55,
  },
});
