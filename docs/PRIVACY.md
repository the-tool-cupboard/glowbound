# Glowbound privacy policy

**Draft. Not hosted.** Do not submit this page, or the placeholder URL below, to the App Store or Google Play.

**Hosting URL (TODO):** `https://example.com/glowbound-privacy`

That address is an example so this draft has a slot to fill. It is not a Glowbound website. Replace it with the real URL, and put the same URL in the store consoles. See [STORE.md](./STORE.md).

**Last updated:** 21 September 2026

**Contact (TODO):** replace this line with a public support address before you host the page.

This is a plain-language draft for a local-only game. Have it read before you publish if you want a legal review. The store forms should say the same thing as the hosted page.

---

## The short version

Glowbound is a memory game you play on your own phone or tablet. Your progress stays on that device. The game has no account, no ad network, and no analytics. An optional Evening chime can schedule a reminder that never leaves the device.

If a later version adds analytics or an account, this page has to change first, and the store data forms have to change with it.

---

## Who this covers

The operator of Glowbound. The public contact address is the TODO above. The game is published as **Glowbound**, package `com.glowbound.app`.

---

## What stays on the device

The game saves with AsyncStorage (on-device storage). It is not uploaded to Glowbound. Uninstalling the app deletes it.

Stored on the device:

- Best score and how far the journey has reached.
- Embers and charms you hold (Path Hint, Lantern Oil, Second Sight, Rune Ward) and Frost Wicks.
- Night Lantern streak, today’s attempts, and stars.
- Whether Evening chime is on.
- Friend ghost seals you paste in (an id, an optional name, a streak, a chapter, stars, and a date), plus the optional name you type for your own seal.
- Sound and music volume, and whether animated backgrounds are on.
- A local switch that unlocks stages. It is a device setting, not an account.

Keys, if you are inspecting a debug build: `glowbound:high-score`, `glowbound:highest-reached-level`, `glowbound:economy`, `glowbound:night-lantern`, `glowbound:lantern-reminder`, `glowbound:lantern-ghosts`, `glowbound:animated-backgrounds`, `glowbound:admin-unlock-all`, `glowbound.audio.sfx`, `glowbound.audio.music`, `glowbound.audio.sfxVolume`, `glowbound.audio.musicVolume`.

---

## Evening chime

Evening chime is **off** until you turn it on from Camp. The system permission prompt appears only then.

The reminder is scheduled on the device with local notifications. Glowbound does not register a remote push token, does not run a server for reminders, and does not read the reminder back from a network.

- Title: “Your lantern waits”
- Body: “Tonight's wick is still unlit — a short lighting, if you wish.”
- Time: 8:00 p.m. America/New_York, and only if that night’s lantern is still unlit.

On Android the channel is named **Night Lantern**. Its description reads: “Evening reminder if tonight's lantern is still unlit. Off unless you turn on Evening chime.”

iOS does not use a custom permission sentence for notifications. The dialog is the system one.

Turn the toggle off to cancel scheduled reminders. You can also revoke notification permission in system settings.

---

## Sharing a seal

From Night Lantern results, or from Camp, you can open the system share sheet with text: a short line about your run, and a ghost-seal code a friend can paste. Glowbound does not receive a copy of that share. Whatever app you pick in the share sheet is governed by that app, not by this policy.

If you import a friend’s code, it is saved only on your device, with the other ghost seals. Ghosts do not change your score, streak, embers, or chapter unlocks.

The optional name on a seal is whatever you type. Leave it blank if you do not want one.

---

## What the game does not do

In this version Glowbound does not:

- Ask you to create an account, and does not collect an email or phone number.
- Show ads.
- Include an analytics or crash-reporting SDK.
- Offer in-app purchases. Embers are earned by playing.
- Use location, camera, microphone, contacts, photos, or tracking across other companies’ apps.
- Send gameplay to a Glowbound server. There is no multiplayer service. A real friend vote would need a server and a new policy; it is not in this version.

---

## Children

The game does not create accounts and does not knowingly collect personal information. An optional seal name stays on the device unless you choose to share the seal text yourself. Complete the store age questionnaires to match this page before release.

---

## Deleting what is stored

Uninstall Glowbound. The operating system removes the on-device save. To drop reminders without uninstalling, turn Evening chime off, or turn notifications off for Glowbound in system settings.

There is no Glowbound server copy to email and delete.

---

## Changes

When this policy changes, update the date at the top and replace the hosted page. The draft in the project is `docs/PRIVACY.md`.
