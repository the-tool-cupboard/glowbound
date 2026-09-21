/**
 * Placeholder looping chapter BGM beds — short, quiet, seamless-ish WAVs.
 * Does not touch enter-stingers or existing hub/results themes.
 * Run: node scripts/generate-chapter-beds.js
 */

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050;
const DURATION_SEC = 5;
const OUT_DIR = path.join(__dirname, "..", "assets", "audio", "music");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function renderLoop(layers) {
  const fade = Math.round(0.12 * SAMPLE_RATE);
  const body = Math.round(DURATION_SEC * SAMPLE_RATE);
  const total = body + fade;
  const raw = new Float32Array(total);

  for (let i = 0; i < total; i += 1) {
    const t = i / SAMPLE_RATE;
    const lfo = 0.84 + 0.16 * Math.sin((2 * Math.PI * t) / DURATION_SEC);
    let sample = 0;
    for (const layer of layers) {
      const phase = 2 * Math.PI * layer.freq * t + (layer.phase ?? 0);
      let wave = Math.sin(phase);
      if (layer.wave === "tri") {
        wave = (2 / Math.PI) * Math.asin(Math.sin(phase));
      } else if (layer.wave === "noise") {
        wave = Math.sin(phase) * 0.35 + (Math.random() * 2 - 1) * 0.65;
      }
      sample += wave * layer.amp;
    }
    raw[i] = sample * lfo;
  }

  const out = raw.slice(0, body);
  for (let i = 0; i < fade; i += 1) {
    const mix = i / fade;
    const a = Math.cos(mix * Math.PI * 0.5);
    const b = Math.sin(mix * Math.PI * 0.5);
    out[i] = raw[i] * b + raw[body + i] * a;
  }
  return out;
}

function writeWav(filePath, floatSamples) {
  const numSamples = floatSamples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i += 1) {
    const pcm = clamp(Math.round(floatSamples[i] * 32767), -32768, 32767);
    buffer.writeInt16LE(pcm, 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

/** Quiet pads; frequencies complete integer cycles over 5s. */
const beds = {
  "chapter-bed-sleeping-woods.wav": [
    { freq: 110, amp: 0.09 },
    { freq: 165, amp: 0.055, wave: "tri" },
    { freq: 220, amp: 0.035 },
  ],
  "chapter-bed-castle-gate.wav": [
    { freq: 98, amp: 0.1 },
    { freq: 147, amp: 0.05 },
    { freq: 196, amp: 0.03, wave: "tri" },
  ],
  "chapter-bed-moonwell.wav": [
    { freq: 123.75, amp: 0.08 },
    { freq: 165, amp: 0.045 },
    { freq: 247.5, amp: 0.04 },
  ],
  "chapter-bed-crystal-ascent.wav": [
    { freq: 196, amp: 0.06 },
    { freq: 294, amp: 0.045 },
    { freq: 392, amp: 0.028 },
  ],
  "chapter-bed-ember-bridge.wav": [
    { freq: 87.5, amp: 0.1 },
    { freq: 131.25, amp: 0.05 },
    { freq: 175, amp: 0.03, wave: "noise" },
  ],
  "chapter-bed-the-tower.wav": [
    { freq: 98, amp: 0.09 },
    { freq: 196, amp: 0.04 },
    { freq: 294, amp: 0.03, wave: "tri" },
  ],
  "chapter-bed-starfall.wav": [
    { freq: 165, amp: 0.05 },
    { freq: 220, amp: 0.035 },
    { freq: 440, amp: 0.022 },
    { freq: 660, amp: 0.012 },
  ],
  "chapter-bed-hollow-crown.wav": [
    { freq: 82.5, amp: 0.11 },
    { freq: 123.75, amp: 0.05 },
    { freq: 165, amp: 0.028 },
  ],
  "chapter-bed-night-orchard.wav": [
    { freq: 110, amp: 0.085 },
    { freq: 137.5, amp: 0.05, wave: "tri" },
    { freq: 220, amp: 0.03 },
  ],
  "chapter-bed-the-bound.wav": [
    { freq: 82.5, amp: 0.1 },
    { freq: 110, amp: 0.055 },
    { freq: 137.5, amp: 0.03 },
  ],
};

const force = process.argv.includes("--force");

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [filename, layers] of Object.entries(beds)) {
  const filePath = path.join(OUT_DIR, filename);
  if (!force && fs.existsSync(filePath)) {
    console.log(`Skip ${filename} (already on disk; pass --force to replace)`);
    continue;
  }
  writeWav(filePath, renderLoop(layers));
  console.log(`Wrote ${filename} (${fs.statSync(filePath).size} bytes)`);
}

console.log("Done.");
