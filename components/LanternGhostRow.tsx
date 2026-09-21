import { Pressable, StyleSheet, Text, View } from "react-native";

import { PathLanternMark } from "@/components/PathLanternMark";
import {
  lanternGhostDisplayName,
  lanternGhostStatusCopy,
  type LanternGhost,
} from "@/lib/lanternGhosts";
import { theme } from "@/lib/theme";

interface LanternGhostRowProps {
  ghosts: readonly LanternGhost[];
  today: string;
  onRemove?: (ghostId: string) => void;
}

export function LanternGhostRow({ ghosts, today, onRemove }: LanternGhostRowProps) {
  if (ghosts.length === 0) {
    return (
      <View
        accessible
        accessibilityLabel="No friend ghosts yet. Import a pasted seal to stand a lantern beside yours."
        style={styles.empty}
      >
        <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.emptyCopy}>
          Friend lanterns stand here — paste a ghost seal when one arrives.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row} accessibilityRole="list">
      {ghosts.map((ghost) => {
        const litTonight = ghost.litDate === today;
        const status = lanternGhostStatusCopy(ghost, today);
        const label = `${lanternGhostDisplayName(ghost.name)}, streak ${ghost.streak}, ${ghost.chapterTitle}, ${status}`;
        return (
          <Pressable
            key={ghost.id}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={onRemove ? "Removes this friend's ghost lantern" : undefined}
            onLongPress={onRemove ? () => onRemove(ghost.id) : undefined}
            delayLongPress={450}
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
          >
            <View style={[styles.mark, litTonight && styles.markLit]}>
              <PathLanternMark pathId="calm" selected={litTonight} size={36} />
            </View>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={styles.name}>
              {lanternGhostDisplayName(ghost.name)}
            </Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={styles.meta}>
              Streak {ghost.streak}
            </Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={styles.chapter}>
              {litTonight ? "lit theirs" : ghost.chapterTitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
    ...theme.artTextShadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: theme.spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.minTapTarget,
    alignItems: "center",
    gap: 4,
    paddingVertical: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.path.calm.rim,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.path.calm.well,
    opacity: 0.72,
  },
  markLit: {
    opacity: 1,
    borderColor: theme.path.calm.flameLit,
  },
  name: {
    color: theme.colors.text,
    ...theme.typography.overline,
    textAlign: "center",
    width: "100%",
  },
  meta: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
    textAlign: "center",
    width: "100%",
  },
  chapter: {
    color: theme.path.calm.flame,
    ...theme.typography.caption,
    textAlign: "center",
    width: "100%",
  },
});
