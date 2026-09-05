import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface GameHeaderProps {
  level: number;
  score: number;
  stage?: number;
  stagesRequired?: number;
}

export function GameHeader({ level, score, stage, stagesRequired }: GameHeaderProps) {
  const stageLabel =
    stage != null && stagesRequired != null ? `Stage ${stage} of ${stagesRequired}` : null;

  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={styles.stat}>
        <Text style={styles.label}>Level</Text>
        <Text style={styles.value} accessibilityLabel={`Level ${level}${stageLabel ? `, ${stageLabel}` : ""}`}>
          {level}
        </Text>
        {stageLabel ? <Text style={styles.stage}>{stageLabel}</Text> : null}
      </View>
      <View style={styles.stat}>
        <Text style={[styles.label, styles.alignRight]}>Score</Text>
        <Text style={[styles.value, styles.alignRight]} accessibilityLabel={`Score ${score}`}>
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
  },
  stat: {
    minWidth: 88,
  },
  label: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.typography.score,
    fontWeight: "700",
  },
  alignRight: {
    textAlign: "right",
  },
  stage: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
