import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

interface LoopingVideoBackgroundProps {
  source: number;
  playing?: boolean;
}

export function LoopingVideoBackground({
  source,
  playing = true,
}: LoopingVideoBackgroundProps) {
  const player = useVideoPlayer(source, (nextPlayer) => {
    nextPlayer.loop = true;
    nextPlayer.muted = true;
    nextPlayer.audioMixingMode = "mixWithOthers";
  });

  useEffect(() => {
    player.loop = true;
    player.muted = true;
    if (playing) {
      player.play();
      return;
    }
    player.pause();
  }, [player, playing]);

  return (
    <View style={styles.frame} collapsable={false}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        playsInline
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    zIndex: 0,
    pointerEvents: "none",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
