# Stage bible

Campaign order is Sleeping Woods → Castle Gate → Moonwell → Crystal Ascent → Ember Bridge → The Tower → Starfall → Hollow Crown → Night Orchard → The Bound. Night Lantern sits beside that journey. See [STAGE-BIBLE-NOTE.md](./STAGE-BIBLE-NOTE.md).

This file locks how a chapter is allowed to speak and how long each beat may last, taken from the ten merged chapter-polish PRs (#9, #10, #11, #12, #13, #14, #15, #22, #23, #25; 15–20 Sep 2026). None of those PRs have review comments. Acceptance is the merge. #15, #22, and #25 also say in the description that Matthew approved the copy and the hold.

A future polish ships as **one batch PR**. Lines and timings inside the ranges below can merge with the batch. Anything in [Outliers](#outliers-flag-for-matthew) is listed at the top of that PR and waits for Matthew.

---

## Chapter polish spec

### Voice

Status copy is one spoken line over the board: quiet, present tense, concrete. It names what the player should notice. It reads during the preview, so it stays a clause.

Shape of a teaching line:

`Name — clause.`

- The dash is an em dash (U+2014) with a space on each side.
- The clause starts in lowercase and ends with a period.
- The name is the stage title (`Sleeping Woods`, `The Tower`, `The Bound`), except Castle Gate, which uses the twist label `Gate pulse` (#9).
- The clause is a fact or a short imperative. Approved verbs and pictures: watch, tap, rise, fall, match, lie, hold, move, claim, seal, flight, ascend, fade.
- The clause names the picture (a lie, a move, a claim, a rise, a fall, a seal). It leaves the implementation in the code (`neighbor`, `topmost`, `unordered`, `ghost cells`).

Difficulty changes the line only when the rule the player must follow changes.

- Starfall Harsh: `Starfall — match the order.` Calm and Standard: `Starfall — watch them fall.` (#10)
- Hollow Crown Harsh: `Hollow Crown — a claim waits in shadow.` Calm and Standard: `Hollow Crown — one is already claimed.` (#13)

Calm still hears the teaching line when the twist itself is off: Moonwell with no ghost (#11), Crystal Ascent with no glints (#23), Sleeping Woods with no twist (#25).

Four input policies are already merged. Keep the one the chapter has.

| Policy | When it is used | Locked line | Source |
| --- | --- | --- | --- |
| Generic tap | Gate, Starfall, Moonwell, Crystal, Ember, Orchard | `Tap the runes you saw.` | #9, #10, #11 |
| Onboarding tap | Sleeping Woods only | `Tap what you saw.` | #25 |
| Same line on input | Tower flights, Bound seals | the preview line | #22, #15 |
| Claim line | Hollow Crown, while a grant is active | `Claimed — tap the rest.` | #13 |

Ember input starts on the generic tap line. When the cool starts it switches to `Embers fade…` (#12).

An in-progress beat may drop the chapter name. Two of those end in an ellipsis (`The lantern holds…`, `Embers fade…`). `Ascend.` ends in a period. See [Open contradictions](#open-contradictions).

Each chapter keeps its own picture.

- Orchard is a move: dim the origin, then light the destination. A bilateral ghost flash is Moonwell’s reflection (#14).
- Bound seals say `first seal` / `final seal`, and the beat between them says `The lantern holds…` (#15).
- Tower flights say `first flight` / `second flight`, and the beat between them says `Ascend.` (#22).

`Flight 1 of 2` remains only for a non-Tower, non-trial helper. Player-facing Tower and Bound copy replaced it (#22, #15). `1 granted` was replaced by `Claimed — tap the rest.` (#13).

Charm replays show the current truth in one step. Second Sight skips the Woods hold (#25), the Crystal lie (#23), and the Orchard leave → land → settle (#14).

### Copy length

Counts are Unicode code points. `—` is one character. `…` is one character. The final period counts. One status string is the whole screen for that beat: the HUD shows `statusNote` or the generic phase line, and every polish PR set a single string.

| Role | Acceptable range | Short end | Long end |
| --- | --- | --- | --- |
| Preview teaching line (`Name — clause.`) | **23–39** characters, **4–7** words, clause **2–5** words | `The Bound — first seal.` (23 / 4 / 2) #15 | `Hollow Crown — a claim waits in shadow.` (39 / 7 / 5) #13 |
| Input line when it is not the preview line | **17–23** characters, **4–5** words | `Tap what you saw.` (17 / 4) #25 | `Claimed — tap the rest.` (23 / 4) #13. Generic restore `Tap the runes you saw.` is 22 / 5 (#9, #10, #11) |
| Interstitial beat (chapter name optional) | **7–18** characters, **1–3** words | `Ascend.` (7 / 1) #22 | `The lantern holds…` (18 / 3) #15. `Embers fade…` is 12 / 2 (#12) |
| Lines on screen | **1** | every polish PR | every polish PR |

Most teaching clauses are 2–3 words (#9, #10, #11, #12, #14, #15, #22, #23, #25). Hollow Crown is the long end, at 4 and 5 words (#13). A sixth word in the clause is an outlier.

Text appears whole, with the beat. None of the ten PRs set a per-character delay. Acceptable text speed is **0 ms per character**.

### Timing

A **band** is the span of values Matthew merged for the same job. Anywhere inside the band, inclusive, can ship in the batch. A **point lock** has one merged value. The number it replaced is recorded so a polish does not walk it back. Editing a point lock is an outlier.

Global preview length (`BASE_PREVIEW_MS` 1600, `MIN_PREVIEW_MS` 800, `PREVIEW_STEP_MS` 8, `BOUND_PREVIEW_STEP_MS` 10) was left alone by all ten PRs. So was the Calm Woods linger of **100 ms** (`CALM_WOODS_PREVIEW_BONUS_MS`, #25).

| Value | Job | Acceptable | What shipped before the polish | Source |
| --- | --- | --- | --- | --- |
| Per-step floor | Each cell of an accumulating preview. `previewMs / count`, floored at this minimum. | **160–170 ms** | Gate 120 ms; Starfall 140 ms | #10 is 160 (`STARFALL_STEP_MIN_MS`). #9 is 170 (`GATE_PULSE_MIN_MS`). |
| Full-shape hold | Added after the shape is complete, before input. | **200–250 ms** | no hold | #25 Woods 200. #9 Gate 220. #10 Starfall 250. |
| Empty settle | Dark beat between two pictures. | **100–150 ms** | no settle | #23 Crystal 100. #11 Moonwell 120. #14 Orchard 150. |
| Input micro-hold | Claimed rune already selected; rune taps wait; charms stay available. | **150 ms** point lock | no hold | #13 `CROWN_INPUT_HOLD_MS` |
| False glint | Dim lie on non-targets. Real targets stay idle. Partitions `previewMs` with the settle; the truth keeps the rest (1000 ms → 240 + 100 + 660 in #23). | **240 ms** point lock | 280 ms, lit on the same beat as the truth | #23 `FACET_GLINT_MS` |
| Glint / truth floor inside that split | Minimum slice while partitioning `previewMs`. | **80 ms** point lock, left as it was | 80 ms | #23 |
| Mirror ghost | Full false pattern after the real preview and the settle. Added after `previewMs`. | **380 ms** point lock | 300 ms | #11 `MIRROR_GHOST_MS` |
| Move, leave | Dim glint on the origin only. | **140 ms** point lock | one bilateral flash of 420 ms | #14 `RIPEN_ROT_LEAVE_MS` |
| Move, land | Bright preview on the destination only. | **200 ms** point lock | the same 420 ms flash | #14 `RIPEN_ROT_LAND_MS` |
| Harsh swap telegraph | Ghost flash, then the neighbor commit. Harsh only. | **400 ms** point lock | 280 ms, and the swap also ran on Calm and Standard | #12 `EMBER_FADE_SWAP_MS` |
| Ember fade clock | When the cool starts during input. | **2400 ms** point lock (`6000 × 0.4`) | 2400 ms | #12, explicitly unchanged |
| Between-flight hold | After flight A clears, before flight B’s preview. Input and charms locked. | **300 ms** point lock | Bound had none. #15 also left Tower at 0. | #15 Bound `LANTERN_TRIAL_HOLD_MS`. #22 Tower `TOWER_ASCEND_MS`. |
| Text speed | How the status line appears. | **instant** (0 ms/character) | instant | all ten PRs |

Holds and telegraphs stack differently. Gate, Starfall, Woods, Moonwell, and Orchard **add** their hold, settle, ghost, or move after the preview budget. Crystal **spends** the preview budget on glint + settle + truth. Ember’s 400 ms telegraph and Crown’s 150 ms micro-hold happen **during input**. The 300 ms flight hold happens **between flights**.

### Checklist

Run this for every chapter in the batch.

1. Read this chapter’s locked line, input policy, Calm / Standard / Harsh gating, and point locks in the [appendix](#appendix-polish-status) before drafting.
2. Preview is one teaching line in `Name — clause.` form, or the existing difficulty pair (Starfall, Hollow Crown).
3. Character count, word count, and clause length sit in the copy-length table.
4. The HUD still shows one string for that beat.
5. Input follows this chapter’s existing policy (generic tap, Woods tap, same line, or claim line).
6. Any timing edit sits in a band, or it leaves the point lock alone. The PR table names the constant and the source PR for that range.
7. Calm still shows the teaching line. The twist stays on or off for Calm exactly as the appendix says.
8. Second Sight and other charm replays stay a single step of the current truth.
9. Neighbor chapters keep their locked lines and constants.
10. The global preview clock, ember fade clock, and Calm Woods +100 ms linger stay put.
11. Tests assert the exact string and the millisecond constant.
12. Anything that fails a step above is copied into **Outliers for Matthew** at the top of the PR.

### Outliers (flag for Matthew)

List these at the top of the batch PR. They wait for Matthew. The rest of the batch can still be described below them.

- A teaching line outside 23–39 characters, 4–7 words, or a clause outside 2–5 words.
- An input line outside 17–23 characters or 4–5 words, or a new fifth input policy.
- An interstitial outside 7–18 characters or 1–3 words, or a third ending besides the ellipsis and the period.
- A second status line, a subtitle, a question, an exclamation mark, an emoji, or a digit in player-facing chapter copy.
- A rename of `Gate pulse` to `Castle Gate`, or a rename of any other chapter to its twist label.
- A per-step floor outside 160–170 ms, a full-shape hold outside 200–250 ms, or an empty settle outside 100–150 ms.
- Any edit to a point lock (150, 240, 80, 380, 140, 200, 400, 2400, 300, the 100 ms Calm linger, or instant text).
- A new timing role: typewriter, status fade, screen crossfade, SFX delay, stair-step sound.
- A change to the global preview clock.
- A mechanic, target, scoring, economy, or difficulty-rule change. Ember’s Harsh-only swap (#12) was a fairness pass inside that PR. A later rule change is an outlier.
- A chapter using another chapter’s picture (bilateral ghost on a move, Tower saying `The lantern holds…`, Bound saying `Ascend.` or `Flight N of 2`).
- A change to who receives the twist on Calm, Standard, or Harsh.
- An edit to a neighbor chapter’s locked line or constant.
- Charm replay that plays the lie, the move telegraph, or the extra Woods hold.
- A pick of one side in [Open contradictions](#open-contradictions).
- Deferred work treated as silent polish: Tower stair-step SFX (#22), a single Bound mega-pattern in place of two flights (#15), Orchard swap turned off on Calm (#14).

### Batch PR format

One PR covers every chapter in the batch. Title: `Polish chapters — <scope>`.

Body, in this order:

1. **Outliers for Matthew.** A list, or the single line `None.` Each outlier names the chapter, the rule it breaks, the current value, and the proposed value.
2. **Before / after copy.** One row per chapter in campaign order, including chapters whose copy is unchanged. Timing columns use milliseconds.

| Chapter | Surface | Before | After | Timing before | Timing after | Within spec? |
| --- | --- | --- | --- | --- | --- | --- |
| Sleeping Woods | Preview | … | … | … | … | yes / outlier |

3. **Leave alone.** Neighbor chapters, SFX, economy, and anything the outliers are asking Matthew to decide.
4. **Checks.** The test command and the result.

### Open contradictions

These are merged PRs that disagree. The spec records both. An agent flags a change that would pick a side, and leaves the shipped behavior in place until Matthew decides.

1. **Decoy length moved both ways.** Moonwell’s ghost was lengthened, 300 → 380 ms, so the lie could be seen (#11). Crystal’s false glint was shortened, 280 → 240 ms, and pulled off the truth’s beat so the real pattern keeps most of the preview (#23). They are different pictures (a full ghost vs a dim glint). They are not one shared decoy duration, and they should not be averaged.
2. **Which name goes in front of the dash.** Castle Gate uses the twist, `Gate pulse` (#9). Every later chapter uses the stage title (#10 onward). Both shipped.
3. **Tower’s between-flight hold.** #15 merged Bound’s 300 ms `The lantern holds…` and left Tower immediate, with no hold. #22 merged a 300 ms `Ascend.` on Tower. Current code follows #22. #15 is not permission to remove that hold.
4. **How an in-progress beat ends.** `Embers fade…` (#12) and `The lantern holds…` (#15) use an ellipsis. `Ascend.` (#22) uses a period. Same kind of beat, two endings.
5. **What input says.** Generic tap (#9, #10, #11, and Crystal / Ember / Orchard, which restore that line), Woods’ shorter tap (#25), the preview line kept on input (#15, #22), and Crown’s claim line (#13) all merged.
6. **Whether Calm skips the twist.** Moonwell’s ghost is off on Calm (#11). Crystal’s glints are off on Calm (#23). Ember’s swap is Harsh-only (#12). Orchard’s move stays on every difficulty, and #14 says Calm gating can wait. The teaching line still shows on Calm in all four.

#10 describes Starfall’s hold as mirroring Gate’s. The merged numbers differ: Gate 220 ms (#9), Starfall 250 ms (#10). Both sit in the 200–250 ms band. They can stay different.

---

## Appendix: polish status

All ten campaign chapters have a merged polish PR. **Unpolished chapters: none.**

| Chapter | Levels | PR | Merged | Locked preview line | Timing locked by that PR |
| --- | --- | --- | --- | --- | --- |
| Sleeping Woods | 1–10 | [#25](https://github.com/the-tool-cupboard/glowbound/pull/25) | 2026-09-20 | `Sleeping Woods — watch, then tap.` Input: `Tap what you saw.` | Full-shape hold 200 ms, added. Calm linger 100 ms left unchanged. |
| Castle Gate | 11–20 | [#9](https://github.com/the-tool-cupboard/glowbound/pull/9) | 2026-09-15 | `Gate pulse — watch it rise.` | Accumulate bottom to top. Step floor 170 ms. Hold 220 ms, added. |
| Moonwell | 21–30 | [#11](https://github.com/the-tool-cupboard/glowbound/pull/11) | 2026-09-15 | `Moonwell — the water lies.` (Calm included, ghost off) | Settle 120 ms. Ghost 380 ms. Standard and Harsh only. |
| Crystal Ascent | 31–40 | [#23](https://github.com/the-tool-cupboard/glowbound/pull/23) | 2026-09-20 | `Crystal Ascent — some light lies.` (Calm included, glints off) | Glint 240 ms, settle 100 ms, truth keeps the rest of `previewMs`. |
| Ember Bridge | 41–50 | [#12](https://github.com/the-tool-cupboard/glowbound/pull/12) | 2026-09-16 | `Ember Bridge — hold the heat.` Fade beat: `Embers fade…` | Fade clock 2400 ms unchanged. Swap telegraph 400 ms, Harsh only. |
| The Tower | 51–60 | [#22](https://github.com/the-tool-cupboard/glowbound/pull/22) | 2026-09-20 | `The Tower — first flight.` / `The Tower — second flight.` Beat: `Ascend.` | Between-flight hold 300 ms. |
| Starfall | 61–70 | [#10](https://github.com/the-tool-cupboard/glowbound/pull/10) | 2026-09-15 | `Starfall — watch them fall.` Harsh: `Starfall — match the order.` | Accumulate top to bottom. Step floor 160 ms. Hold 250 ms, added. |
| Hollow Crown | 71–80 | [#13](https://github.com/the-tool-cupboard/glowbound/pull/13) | 2026-09-15 | `Hollow Crown — one is already claimed.` Harsh: `Hollow Crown — a claim waits in shadow.` Input: `Claimed — tap the rest.` | Input micro-hold 150 ms. |
| Night Orchard | 81–90 | [#14](https://github.com/the-tool-cupboard/glowbound/pull/14) | 2026-09-16 | `Night Orchard — one fruit moves.` | Leave 140 ms, land 200 ms, settle 150 ms. Swap stays on Calm. |
| The Bound | 91–99, and L100 | [#15](https://github.com/the-tool-cupboard/glowbound/pull/15) | 2026-09-16 | 91–99: `The Bound — the spiral tightens.` L100: `The Bound — first seal.` / `The lantern holds…` / `The Bound — final seal.` | Lantern-trial hold 300 ms. Two-flight structure unchanged. |

Later Sleeping Woods work sits outside this spec and does not extend the ranges: Last Chance coach ([#38](https://github.com/the-tool-cupboard/glowbound/pull/38), 320 ms menu delay, longer menu sentences) and the first-run watch → tap coach ([#48](https://github.com/the-tool-cupboard/glowbound/pull/48), 1200 ms veils).

Still deferred inside the polish PRs, and still outliers if a batch includes them: Tower stair-step SFX (#22), a Bound mega-pattern instead of two flights (#15), Orchard swap gated off on Calm (#14).
