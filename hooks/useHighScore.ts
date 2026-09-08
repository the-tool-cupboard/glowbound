import { useCallback, useEffect, useState } from "react";

import { getHighScore, setHighScore } from "@/lib/storage";

export function useHighScore() {
  const [highScore, setHighScoreState] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getHighScore()
      .then((value) => {
        if (!cancelled) {
          setHighScoreState(value);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recordScore = useCallback(async (score: number) => {
    try {
      const current = await getHighScore();
      const next = Math.max(current, score);
      setHighScoreState(next);

      if (next !== current) {
        await setHighScore(next);
      }

      return next;
    } catch {
      setHighScoreState((current) => Math.max(current, score));
      return Math.max(0, Math.floor(score));
    }
  }, []);

  return {
    highScore,
    ready,
    recordScore,
  };
}
