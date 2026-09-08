import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface GameHeaderProps {
  level: number;
  score: number;
  stage?: number;
  stagesRequired?: number;
  onArt?: boolean;
}

export function GameHeader({ level, score, stage, stagesRequired, onArt = false }: GameHeaderProps) {
  const stageLabel =
    stage != null && stagesRequired != null ? `Pattern ${stage} of ${stagesRequired}` : null;
  const artStyle = onArt ? styles.onArt : undefined;

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
      <View style={styles.side}>
        <Text style={[styles.label, styles.alignRight, artStyle]}>Score</Text>
        <Text style={[styles.value, styles.alignRight, artStyle]} accessibilityLabel={`Score ${score}`}>
          {score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
  },
  side: {
    flex: 1,
    minWidth: 72,
  },
  center: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
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
});
