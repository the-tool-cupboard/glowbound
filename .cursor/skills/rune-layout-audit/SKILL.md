---
name: rune-layout-audit
description: >-
  Audits Glowbound rune board layouts for proportional spacing and overlap.
  Use when the user types rune-layout-audit, rune audit, audit QA, layout QA,
  rune overlap, rune spacing, or asks to re-run the rune layout QA.
---

# Rune layout audit

Repeatable QA for chapter rune shapes. Do not skip the numeric checks — eyeballing a screenshot missed the cell-size overlap last time.

## When invoked

1. Run the automated audit.
2. Read the layout + render code.
3. Report in the template below.
4. If anything fails, fix it in the same turn, then re-run the audit until it passes.
5. Give iOS/Android manual steps.

## Automated checks (must run)

From the repo root:

```bash
npx jest --watchman=false __tests__/runeLayouts.test.ts __tests__/runeLayoutAudit.test.ts
```

`lib/runeLayoutAudit.ts` is the source of truth for numbers. If you need a printed table, evaluate `formatRuneLayoutAudit(auditAllChapterLevels())` (via a short jest assertion or node after the tests).

A layout **fails** when any of these are true:

- Duplicate coordinates
- A point outside the 0–1 board
- `minNormalizedDistance` ≤ `0.1`
- At a 280px board, pixel gap `<` cell size (`overlapsAt280`)
  - Pixel gap = `minDist * (boardSize - cellSize)`
  - Cell size **must** come from `runeCellSize()` — never inflate with `minTapTarget`

## Code checks (the bugs this audit already caught)

Read:

- `lib/runeLayouts.ts`
- `lib/runeLayoutAudit.ts`
- `components/RuneGrid.tsx`
- `components/CircleRune.tsx`

Confirm:

1. **Cell size** uses `runeCellSize` / `RUNE_SPACING_GAP` only. Forcing 60pt cells on a tight layout makes orbs overlap.
2. **Hit slop** on `CircleRune` is `0`. Extra slop overlaps neighbors even when cells do not.
3. **Orb** is 80% of the cell; gap `0.82` leaves visible air.
4. **Silhouette** still matches the chapter: lantern, arch, hex crystal, spire. Even spacing, then `normalizePoints` so the shape fills the board.
5. **Growth** is still a prefix of the same point list (level 2 contains level 1’s points, in order).
6. Pure rules stay in `lib/`; no `any`; accessible rune labels stay on.

## What was not useful

- Restyling unrelated screens
- Changing Calm/Harsh or target-count formulas
- Judging overlap from a single screenshot without min-distance math

## Report template

```markdown
## Rune layout audit

**Tests:** pass / fail

| Level | Shape | Runes | Min dist | Closest pair | Overlap @ 280 |
| --- | --- | --- | --- | --- | --- |
| … | … | … | … | #a–#b | no / yes |

**Code:** cell sizing ok / hit slop ok / silhouettes ok

**Fixes:** none / (files + what changed)

**Manual (iOS and Android):**
1. Woods lantern — orbs sit on the lamp, not stacked.
2. Gate arch — pillars and curve stay separate.
3. Crystal hex — even lattice.
4. Tower spire — rows stay stepped through 36.
```

## If tests fail

Fix `lib/runeLayouts.ts` (point lists / normalize) and/or `RuneGrid` / `CircleRune` (sizing, hit slop). Do not loosen the audit thresholds to make a clustered layout pass.
