# Glowbound launch board

Tick these boxes in this file. Checked items are already on `main` as of 21 Sep 2026 (`be0c400`). Open boxes are still yours.

Listing draft: [STORE.md](./STORE.md). Privacy draft: [PRIVACY.md](./PRIVACY.md). Design index: [README.md](./README.md).

This board is docs only. It does not add gameplay, onboarding UI, or final store art.

---

## Already on main

- [x] **Night Lantern Phase 1** — daily 5-pattern loop, stars, streak, ember drip, one free rematch (`0e2d860`).
- [x] **Night Lantern Phase 2** — Frost Wick stall, in-app seal card, system share of text, streak glow at 7 (`4b2a1cf`).
- [x] **Night Lantern Phase 2.5** — Evening chime, opt-in, local notifications only, default off (`be0c400`).
- [x] **Night Lantern Phase 3** — pasteable friend ghost seals and a cosmetic weekly whisper. The whisper is not a vote (`959a39e`).
- [x] **Journey complete** — clearing The Bound ends the campaign: “The Bound is sealed. The lantern holds.” (`7bdfbc9`).
- [x] **Lazy SFX** — sound effects allocate when first played (`6fe180e`). The WAV files are still generated placeholders (`scripts/generate-sfx-wavs.js`).
- [x] **BGM slots wired** — menu, play, results, and one bed per chapter (`017eb56`). Chapter beds are 5-second generated loops, not final music. See P0.
- [x] **Shop scroll** — stall shelf scrolls on the Shop screen and on level-complete (`f7952c1`).
- [x] **Expo SDK 57 toolchain** — `expo@~57.0.24`, React Native 0.86.3 (`01e26c0`). A native binary and device smoke are still open under P0.
- [x] **Local save** — progress, embers, lantern, ghosts, audio, and the motion preference live in AsyncStorage on the device. No account and no server.
- [x] **Sleeping Woods Last Chance coach** — first wrong tap in the Woods only (`bca3100`). This is not the first-run watch-then-tap onboarding. That stays P1.

---

## P0 — must be done before the stores

- [ ] **Native SDK 57 rebuild and device smoke.** Install a development or store build on a physical iPhone and a physical Android phone (Xcode 26.4+, iOS 16.4+; Expo Go on the App Store may lag this SDK). Then tick the smoke list:
  - [ ] iOS build installs and reaches Camp.
  - [ ] Android build installs and reaches Camp.
  - [ ] Begin Journey → one pattern → level clear → shop stall on the clear screen scrolls.
  - [ ] Light the Night Lantern → results seal (text share).
  - [ ] Evening chime stays off until the Camp toggle is turned on, then the system permission prompt appears.
  - [ ] Motion toggle on Camp swaps the looping video and the still painting.
- [ ] **Store kit art.** Do not treat the current files as final. Paths and what is there today are in [STORE.md](./STORE.md).
  - [ ] Approve or redraw `assets/images/icon.png` (1024×1024 lantern glyph, no alpha).
  - [ ] Replace `assets/images/splash-icon.png` (still a grid placeholder on `#0B1220`).
  - [ ] Replace the Android adaptive set. Foreground, monochrome, and background are still the Expo template, and `app.json` tints the adaptive background `#E6F4FE` (template blue) against a navy game.
  - [ ] Capture the screenshot shot list in [STORE.md](./STORE.md). No frames are in the repo yet.
- [ ] **Listing copy approved.** Draft subtitle, descriptions, keywords, and What’s New are in [STORE.md](./STORE.md). Edit them there, then paste into App Store Connect and Play Console.
- [ ] **Privacy policy URL.** Host [PRIVACY.md](./PRIVACY.md). The draft uses `https://example.com/glowbound-privacy` as a **TODO placeholder**. That address is not live. Do not submit it.
- [ ] **Final BGM beds.** Replace the placeholder chapter loops from `scripts/generate-chapter-beds.js` (`assets/audio/music/chapter-bed-*.wav`, ten files, about five seconds each). Listen to `menu-theme.wav`, `play-theme.wav`, and `results-theme.wav` in the same pass before calling the beds done. SFX already play; they are separate placeholder WAVs and are not this box.
- [ ] **Stability pass.** Camp, a full chapter step, Night Lantern (including a missed day and Frost Wick), Shop scroll, and the Evening chime toggle, with no redbox. Note the device and build under this box when you tick it.
- [ ] **Legal, age rating, and local-save clarity.** Complete the App Store age questionnaire and the Play content rating and Data safety form so they match [PRIVACY.md](./PRIVACY.md): on-device save, optional local notification, no account, no ads, no analytics, no IAP. Suggested band is 4+ / Everyone; the forms are the record.

---

## P1 — should be done before 1.0

- [ ] **First-run watch → tap onboarding.** In-run status already says “Watch the runes.” then “Tap the runes you saw.” There is no first-launch coach that walks a new player through one preview and one tap. The Woods Last Chance coach (shipped) only appears after a miss.
- [ ] **Tower stair-step SFX.** The Tower’s two-flight twist has status copy (`towerFlightNote`) and a chapter-enter sting. It does not yet play a distinct step sound as the flight changes.
- [ ] **Share seal image.** Results and Camp share text plus an in-app seal card. Image export (a picture the share sheet can attach) is still deferred.
- [ ] **Balance skim.** Read ember drip, charm prices, Frost Wick at 40 embers, and lantern star thresholds on device. Tick this only after you are willing to ship the current numbers.
- [ ] **Motion toggle everywhere.** The switch lives on Camp only. Stages and Shop already follow the saved preference for video, but a player who is not on Camp cannot change it. Extend the control to every screen that plays motion.

---

## Post-launch

- [ ] **Hub art pass.** A dedicated paint pass on Camp and the other hubs, after the store icon and splash are already approved.
- [ ] **Real friend vote.** Needs a server. Today’s “weekly whisper” is a local cosmetic (`floor(dayIndex / 7) % 10`). Do not fake a vote on the client.
- [ ] **Analytics.** Not in 1.0. If this is ever turned on, update [PRIVACY.md](./PRIVACY.md) and both store data forms before the build that sends anything off device.
- [x] **No IAP.** Leave this checked. Embers and Frost Wicks stay earned in play. Do not add a payment SDK, a price, or a restore-purchases flow unless this box is explicitly reopened.
