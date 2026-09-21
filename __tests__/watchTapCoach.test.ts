import { createElement, type ComponentType } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useMemoryGame } from "../hooks/useMemoryGame";
import { LEVEL_COMPLETE_DELAY_MS, getLevelConfig } from "../lib/gameConfig";
import {
  SLEEPING_WOODS_INPUT_NOTE,
  SLEEPING_WOODS_STATUS_NOTE,
  WATCH_TAP_TAP_NOTE,
  WATCH_TAP_WATCH_NOTE,
  WOODS_HOLD_MS,
  watchTapBeatDurationMs,
} from "../lib/stageModifiers";

type GameApi = ReturnType<typeof useMemoryGame>;

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function Harness({ onGame }: { onGame: (game: GameApi) => void }) {
  const game = useMemoryGame();
  onGame(game);
  return null;
}

describe("watch-tap coach playback", () => {
  let game: GameApi;
  let renderer: TestRenderer.ReactTestRenderer;

  beforeEach(() => {
    jest.useFakeTimers();
    game = undefined as unknown as GameApi;
    act(() => {
      renderer = TestRenderer.create(
        createElement(Harness as ComponentType<{ onGame: (game: GameApi) => void }>, {
          onGame: (next: GameApi) => {
            game = next;
          },
        })
      );
    });
  });

  afterEach(() => {
    act(() => {
      renderer.unmount();
    });
    jest.useRealTimers();
  });

  function startFreshCoach() {
    act(() => {
      game.startGame(1, "standard", { mode: "campaign", watchTapCoach: true });
    });
  }

  function finishOpeningBeat() {
    expect(game.phase).toBe("idle");
    expect(game.watchTapCoachBeat).toBe("watch");
    expect(game.statusNote).toBe(WATCH_TAP_WATCH_NOTE);
    expect(game.watchTapCoachCompleted).toBe(false);

    advance(watchTapBeatDurationMs("watch"));
    expect(game.phase).toBe("preview");
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.statusNote).toBe(SLEEPING_WOODS_STATUS_NOTE);
    expect(game.previewCellIds.length).toBeGreaterThan(0);

    advance(getLevelConfig(1).previewDurationMs + WOODS_HOLD_MS);
    expect(game.phase).toBe("preview");
    expect(game.watchTapCoachBeat).toBe("tap");
    expect(game.statusNote).toBe(WATCH_TAP_TAP_NOTE);
    expect(game.previewCellIds).toEqual([]);
    expect(game.watchTapCoachCompleted).toBe(false);

    act(() => {
      game.onRunePress(0);
    });
    expect(game.selectedCellIds).toEqual([]);

    advance(watchTapBeatDurationMs("tap"));
    expect(game.phase).toBe("playerInput");
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.statusNote).toBe(SLEEPING_WOODS_INPUT_NOTE);
    expect(game.watchTapCoachCompleted).toBe(true);
  }

  it("shows the watch then tap beats once on a fresh Woods L1 run", () => {
    startFreshCoach();
    finishOpeningBeat();

    for (const cellId of game.targetCellIds) {
      act(() => {
        game.onRunePress(cellId);
      });
    }

    expect(game.phase).toBe("stageComplete");
    advance(LEVEL_COMPLETE_DELAY_MS);
    expect(game.stage).toBe(2);
    expect(game.phase).toBe("preview");
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.statusNote).toBe(SLEEPING_WOODS_STATUS_NOTE);
  });

  it("skips the beat on Night Lantern, later levels, rematches, and after it has played", () => {
    act(() => {
      game.startGame(1, "standard", {
        mode: "lantern",
        watchTapCoach: true,
        targetCountOverride: 3,
      });
    });
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.phase).toBe("preview");
    expect(game.watchTapCoachCompleted).toBe(false);

    act(() => {
      game.startGame(11, "standard", { watchTapCoach: true });
    });
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.phase).toBe("preview");
    expect(game.statusNote).not.toBe(WATCH_TAP_WATCH_NOTE);

    act(() => {
      game.startGame(1, "standard", { score: 25, watchTapCoach: true });
    });
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.phase).toBe("preview");
    expect(game.score).toBe(25);

    startFreshCoach();
    finishOpeningBeat();

    act(() => {
      game.startGame(1, "standard", { watchTapCoach: false });
    });
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.phase).toBe("preview");
    expect(game.statusNote).toBe(SLEEPING_WOODS_STATUS_NOTE);

    act(() => {
      game.restartGame();
    });
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.phase).toBe("preview");
  });

  it("holds the watch beat while the run is paused", () => {
    startFreshCoach();
    act(() => {
      game.pauseForInterrupt();
    });
    advance(watchTapBeatDurationMs("watch") + 400);
    expect(game.watchTapCoachBeat).toBe("watch");
    expect(game.phase).toBe("idle");

    act(() => {
      game.resumeAfterInterrupt();
    });
    advance(watchTapBeatDurationMs("watch"));
    expect(game.phase).toBe("preview");
    expect(game.watchTapCoachBeat).toBeNull();
    expect(game.statusNote).toBe(SLEEPING_WOODS_STATUS_NOTE);
  });
});
