# Night Lantern — Daily Loop (design lock)

**Status:** draft for Matthew lock · **Goal:** Candy Crush–style “one more try” without wrecking Glowbound’s mood  
**Fits:** beside the 10×10 campaign · does **not** replace Journey / Bound finale  
**Scope:** design only — no gameplay implementation in this document

---

## Pitch (one line)

Every night you light a short lantern run — always ends in a score, almost always in a near-miss, and a streak that makes tomorrow feel earned.

---

## Why this, not more campaign

| Campaign | Night Lantern |
| --- | --- |
| Long wipe risk | Fixed **5 patterns** (~60–90s) |
| Progress is permanent unlock | Progress is **daily stars + streak** |
| Difficulty = chapter twist | Difficulty = **today’s chapter skin** + soft ladder |
| Embers from clears / fail grant | Tiny **ember drip** + **streak freeze** economy |

---

## Player loop (session)

1. **Camp** shows a Night Lantern card when available (or “Relit in Hh Mm”).
2. Tap **Light the lantern** → brief stinger → enter play.
3. Play **exactly 5 patterns** on today’s board (see Rotation).
4. Miss uses existing Last Chance / Ward rules once; second miss **ends the lantern** (not the whole campaign).
5. Results: **lantern stars (0–3)** + ember drip + streak update + share card.
6. Optional **one free rematch** only if stars ≤ 1 (near-miss pull). Cap: **2 attempts / day**. Frost Wick is a **streak freeze**, not a paid rematch (Phase 1 rematch already covers the free second lighting).

Session always ends before rage. Never deep-links into campaign mid-lantern.

---

## Today’s board (rotation)

- **Chapter of the day** = `(dayIndex % 10)` mapped to stages 1–10 (Sleeping Woods … The Bound).
- Uses that chapter’s **layout + twist + BG + bed** (reuse campaign systems).
- **Difficulty overlay:** defaults to player’s last campaign difficulty; lantern never forces Harsh on day 1–3 of install.
- Pattern length scales gently by day-of-week, not by campaign level:
  - Sun–Tue: easier (Woods / Gate–ish target counts)
  - Wed–Thu: mid
  - Fri–Sat: spicy (still 5 patterns max)

Campaign unlock gates do **not** block lantern — day-1 players can play Woods lantern even if that’s their only chapter. Later days may preview locked chapter art as “tonight’s dream” without unlocking campaign progress.

---

## Stars (the near-miss)

| Stars | Condition (tunable) |
| --- | --- |
| ★★★ | Clear all 5 with no Last Chance used |
| ★★ | Clear all 5, used Last Chance or Ward once |
| ★ | Cleared ≥3 patterns, then failed |
| ✦ | Cleared ≤2 — still grant **consolation embers** (never zero if they started) |

UI copy leans near-miss:

- 2★: “The lantern almost held.”
- 1★: “Embers flickered — one more lighting?”
- 3★: “The lantern holds till dawn.”

---

## Streak

- **+1 streak** when you earn ≥1★ on a calendar day (America/New_York for Matthew’s builds; later: device local).
- Miss a day → streak → 0, **unless** you spend one **Frost Wick** (shop charm / 40 embers) to freeze once.
- Streak milestones (cosmetic / ember, not paywall):
  - 3: “Kindled” title on share card
  - 7: small ember bonus + camp lantern particle
  - 14 / 30: badge only (no power creep)

No dark-pattern countdown that punishes sleep. Soft: “Lantern dims at dawn.”

---

## Rewards (keep economy honest)

- Base drip: `3 + stars*2 + floor(streak/7)` embers (Calm/Standard/Harsh multipliers optional, mild).
- Does **not** advance `highestReached` or chapter unlocks.
- Charms usable in lantern (consumes inventory) — Ward drama stays.
- No infinite rematch farming: hard cap 2 attempts / day.

---

## UI surfaces

1. **Camp card** — lantern glyph, streak count, “Light” / timer.
2. **In-run** — reuse game HUD; status “Night Lantern · Pattern k of 5”; hide campaign level number or show “Lantern”.
3. **Results** — stall plates: Stars · Streak · Embers; buttons: Return Camp · Rematch (if eligible) · Share.
4. **Share card** — pixel still + “Sealed N patterns under [Chapter] · streak S”. Phase 2: in-app card + system share of that copy; image export later.

Visual language: same sky/dock veils + stall plates as difficulty/results. No Candy Crush rainbow chrome.

---

## Audio / juice

- Enter: soft lantern strike (new SFX or reuse ember-gain quiet).
- 3★: existing level-clear / constellation-ish sting.
- Near-miss rematch prompt: last-chance sting, softer.
- Bed: today’s chapter bed at slightly lower duck so it feels like a dream of that stage.

---

## Anti-goals

- No lives that block campaign play.
- No forced ads / IAP for streak (Frost Wick is optional earnable).
- No leaderboards in Phase 1–2 (async friends = Phase 3).
- No changing campaign twists to feed lantern.

---

## Build phases

### Phase 1 — Ship the loop (shipped)

- Storage: `nightLantern` { lastPlayDate, attemptsToday, streak, freezeOwned, bestStarsByDay }
- Route `/lantern` or `game` mode=`lantern`
- Camp entry + 5-pattern run + stars results + streak + ember drip + 1 free rematch rule
- Reuse chapter rotation + existing twists

### Phase 2 — Juice (this PR)

Shipped:

- **Frost Wick** shop stall (40 embers, cap 3). Buying increments `freezeOwned`. Not a run charm.
- Miss exactly one calendar day with a wick owned → Camp offer **Use Frost Wick** / **Let it fade**. Using one wick sets last play to yesterday and keeps the streak.
- **Share** on lantern results: in-app seal card (chapter, stars, streak; **Kindled** title at streak ≥ 3) + system share sheet (`Share.share` text). Image export still later.
- Camp lantern **streak ≥ 7** glow + pixel ember motes (static halo when motion is off). Ember bonus `floor(streak/7)` already shipped in Phase 1.

Deferred:

- **Phase 2.5 — Push reminders (opt-in).** Needs notification permission + local scheduling. Not in-repo; do not ship until that stack exists.
- Share-card **image** render/export (ViewShot / file share). Phase 2 ships text + in-app card.

### Phase 3 — Social light

- Weekly “which chapter” vote or friend streak ghosts (async). Leaderboards stay here, not Phase 2.

---

## Success metrics (simple)

- D1 → D7 return with ≥1 lantern play
- Rematch rate after 1★ (want high) vs after 3★ (want low)
- No spike in campaign rage-quits after lantern ships

---

## Open questions for lock

1. **Attempts:** 2/day hard cap OK, or 1 + paid rematch only?
2. **Locked chapters in rotation:** dream-preview OK, or only unlocked chapters until Bound?
3. **Frost Wick:** new charm vs ember-only freeze?
4. **Timezone:** device local vs fixed ET?
