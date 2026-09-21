# Glowbound store kit

Draft listing for the App Store and Google Play. Paste into the consoles after the [launch board](./LAUNCH.md) P0 boxes are ticked. Privacy text: [PRIVACY.md](./PRIVACY.md).

Nothing here is submitted. Screenshot frames and final icon art are not in this repo.

---

## Identity

| Field | Value |
| --- | --- |
| Name | Glowbound |
| iOS subtitle | Remember the glowing path |
| Play short description | Quiet rune memory by lantern light. Ten chapters and a short evening run. |
| Bundle / package | `com.glowbound.app` |
| Version | 1.0.0 (`app.json` and `package.json`) |
| Category | Games → Puzzle |
| Price | Free |
| In-app purchases | None |

Subtitle is 25 characters (limit 30). The Play short description is 73 characters (limit 80). Keywords are 100 characters (limit 100). Promotional text is 108 characters (limit 170).

---

## Description

Use this for the App Store description and the Play full description.

```
Glowbound is a quiet memory game played by lantern light.

Watch a path of runes, then tap it back. Ten chapters carry you from the Sleeping Woods to The Bound. Each chapter has its own ground, its own twist, and a bed of night music. Clear The Bound and the journey is complete.

When you want a shorter night, light the Night Lantern. Five patterns, a few stars, and a streak you can keep. Miss a day and a Frost Wick, bought with embers you earned, can hold the streak once. There is no account to sign into and nothing to buy with money.

Charms stay small. Spend embers on a hint, a longer glow, a second look, or a ward.

Progress, embers, and your lantern streak stay on this device. An optional Evening chime can remind you at dusk. It stays off until you turn it on.

No ads. No accounts. No purchases.
```

## Promotional text (App Store, 170 characters)

```
Watch the runes, then tap the path back. Ten quiet chapters, and a Night Lantern when you want one more try.
```

## Keywords (App Store, 100 characters)

Comma-separated, no spaces. Do not add the app name.

```
memory,puzzle,lantern,runes,pattern,calm,daily,streak,night,glow,woods,castle,moon,ember,relax,focus
```

## What’s New (1.0.0)

```
First light. Walk ten night chapters from the Sleeping Woods to The Bound, light a short Night Lantern, and keep your progress on this device.
```

---

## Screenshot shot list

Capture on a device build after the P0 smoke, with motion either on or off for the whole set (do not mix). Hide the admin unlock control if it reads as a cheat. Portrait only.

Store both stores’ first three frames in this order. The later frames fill the set.

| # | Beat | What to show | Leave out |
| --- | --- | --- | --- |
| 1 | Night Lantern — Camp | Camp with the Night Lantern card ready to light: tonight’s chapter title, streak, and the light button. Evening chime visible and **off**. | A “relit in…” timer, a Frost Wick offer covering the card, or an imported ghost row unless you want a second social frame. |
| 2 | Night Lantern — results | Lantern results with stars, streak, embers, and the in-app seal card. | The system share sheet. Image export is not in 1.0. |
| 3 | Chapter beat — in the journey | One campaign pattern in progress, not the daily lantern. Prefer a chapter whose twist reads in a still: Moonwell, The Tower (flight note visible), or The Bound. Status line in shot (“Watch the runes.” or “Tap the runes you saw.”). | The level-select grid as the only “chapter” frame. |
| 4 | Chapter beat — clear | Level-complete stall, ember grant visible, shop shelf starting to show. Optional alternate: Journey complete, with the line “The Bound is sealed. The lantern holds.” Use one of these, and keep the other as a spare. | A fail screen as the only results frame. |
| 5 | Shop | Shop title, ember balance, and the stall: Path Hint, Lantern Oil, Second Sight, Rune Ward, and Frost Wick. Scroll so the lower stalls are clearly reachable if one frame cannot hold all five. | A failed-purchase toast. |

App Store also needs an iPad set if the binary keeps `supportsTablet: true` (it does today). Replay the same five beats on an iPad-sized simulator or device; do not crop the phone frames.

Play also needs a 1024×500 feature graphic. That file is not drawn yet. Same lantern-on-navy mood as the icon, name set in the console’s own type if the graphic has no title baked in.

Confirm exact pixel sizes in App Store Connect and Play Console on submission day. Do not invent a second set of frames to hit an old size chart.

---

## Icon, splash, and adaptive paths

These paths are already what `app.json` points at. Refreshing the pictures is a P0 art task. This document does not replace the files.

| Role | Path | `app.json` | On disk today |
| --- | --- | --- | --- |
| iOS / store icon | `assets/images/icon.png` | `expo.icon` | 1024×1024 RGB, no alpha. Lantern glyph on navy. Approve or redraw before upload. |
| Splash image | `assets/images/splash-icon.png` | `expo-splash-screen` plugin, `imageWidth` 200, `resizeMode` `contain` | 1024×1024 grid placeholder. Replace. |
| Splash ground | — | background `#0B1220` (dark block matches) | Keep the navy unless the new splash art needs a different ground. |
| Android adaptive foreground | `assets/images/android-icon-foreground.png` | `android.adaptiveIcon.foregroundImage` | 512×512 template mark. Replace. |
| Android adaptive background image | `assets/images/android-icon-background.png` | `android.adaptiveIcon.backgroundImage` | Template asset. Replace. |
| Android monochrome | `assets/images/android-icon-monochrome.png` | `android.adaptiveIcon.monochromeImage` | Template asset. Replace. |
| Android adaptive background color | — | `#E6F4FE` | Template blue. Move this to the navy splash ground when the adaptive art is redrawn. |
| Web favicon | `assets/images/favicon.png` | `expo.web.favicon` | 48×48. Not a store asset. |

Notification tray icon: not set. Local reminders use the app icon. Do not add a tray icon until there is a real 96×96 white-on-transparent asset.

---

## Expo notification config

Checked against Expo SDK 57 `expo-notifications` (the version in this repo).

**iOS usage string.** The SDK 57 docs say no usage description is required for notifications. Apple’s prompt is the system dialog (“Glowbound Would Like to Send You Notifications”). There is no Info.plist purpose string that changes that sentence, so `app.json` does not add one. Remote background notifications stay off: the plugin keeps `enableBackgroundRemoteNotifications: false`.

**Android channel copy.** The config plugin cannot store a channel name or description. Those are set at runtime, which is what Android 13 needs before the permission prompt. Evening chime creates channel `lantern-evening` before it asks:

- Name: **Night Lantern**
- Description: **Evening reminder if tonight's lantern is still unlit. Off unless you turn on Evening chime.**

`defaultChannel` is only the FCMv1 fallback. It is left unset on purpose. This game does not fetch a push token.

The player still has to turn Evening chime on. The toggle defaults to off and does not prompt on launch.

---

## URLs to paste at submission

Both of these are **TODO placeholders**. They are not hosted. Replace them before you submit. Do not ship `example.com`.

| Console field | Placeholder |
| --- | --- |
| Privacy policy URL | `https://example.com/glowbound-privacy` |
| Support URL | `https://example.com/glowbound-support` |

Host the privacy page from [PRIVACY.md](./PRIVACY.md). The support page can be a short contact note plus the same privacy link.

---

## Age rating and data forms

Answer from the shipping build, not from later ideas.

- No accounts, no ads, no analytics SDK, no IAP, no location, camera, microphone, or contacts.
- Optional Evening chime: local notification only.
- Optional display name and pasted friend seals stay on device unless the player sends the share-sheet text themselves.
- Unrestricted web: none.
- Violence, gambling, horror: none in the puzzle. Fantasy lantern setting.
- Suggested result: App Store 4+, Play Everyone. Tick the P0 legal box only after the questionnaires match [PRIVACY.md](./PRIVACY.md).

App Store privacy nutrition: **Data Not Collected**, until an analytics SDK exists. Play Data safety: data is not collected; progress is stored on the device; the notification permission is optional.

---

## Reviewer note (paste if a console asks)

Glowbound is an offline memory puzzle. Progress is stored on the device with AsyncStorage. There is no login. Evening chime is off until the player turns it on from Camp; the reminder is scheduled locally and is not a remote push. The shop spends embers earned in play. There is no real-money purchase.
