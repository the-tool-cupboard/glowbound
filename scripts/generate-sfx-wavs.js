/**
 * One-shot generator for placeholder 16-bit PCM WAV SFX assets.
 * Run: node scripts/generate-sfx-wavs.js
 */

const fs = require("fs");
const path = require("path");
const { archiveExistingAudio } = require("./audioArchive");

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, "..", "assets", "audio", "sfx");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function envelope(sampleIndex, totalSamples, attack = 0.02, release = 0.35) {
  const t = sampleIndex / totalSamples;
  if (t < attack) {
    return t / attack;
  }
  if (t > 1 - release) {
    return Math.max(0, (1 - t) / release);
  }
  return 1;
}

function tone(freq, durationMs, amplitude = 0.35, wave = "sine") {
  const totalSamples = Math.max(1, Math.round((durationMs / 1000) * SAMPLE_RATE));
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const env = envelope(i, totalSamples);
    let sample = 0;
    if (wave === "sine") {
      sample = Math.sin(2 * Math.PI * freq * t);
    } else if (wave === "square") {
      sample = Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
    } else if (wave === "noise") {
      sample = Math.random() * 2 - 1;
    }
    samples[i] = sample * amplitude * env;
  }
  return samples;
}

function concat(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function silence(durationMs) {
  const totalSamples = Math.max(1, Math.round((durationMs / 1000) * SAMPLE_RATE));
  return new Float32Array(totalSamples);
}

function arpeggio(freqs, noteMs, amplitude = 0.3) {
  return concat(freqs.map((freq) => tone(freq, noteMs, amplitude)));
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

const sounds = {
  "ui-tap.wav": tone(1400, 80, 0.42),
  "ui-select.wav": tone(950, 95, 0.38),
  "rune-tap.wav": tone(620, 65, 0.28),
  "rune-correct.wav": concat([tone(523, 90, 0.32), silence(18), tone(659, 110, 0.34)]),
  "rune-wrong.wav": concat([
    tone(220, 70, 0.35, "square"),
    tone(180, 90, 0.28, "noise"),
  ]),
  "preview-chime.wav": tone(880, 140, 0.3),
  "stage-clear.wav": arpeggio([523, 659, 784], 70, 0.28),
  "level-clear.wav": arpeggio([392, 523, 659, 784], 75, 0.3),
  "game-over.wav": arpeggio([392, 330, 262], 90, 0.32),
  "charm-use.wav": arpeggio([440, 554, 659], 55, 0.26),
  "ward-arm.wav": concat([tone(280, 100, 0.25), silence(20), tone(720, 80, 0.3)]),
  "purchase.wav": concat([tone(988, 55, 0.3), silence(12), tone(1175, 70, 0.32)]),
  "purchase-fail.wav": tone(120, 120, 0.45, "square"),
  "ember-gain.wav": arpeggio([784, 988, 1175, 1319], 50, 0.24),
};

const force = process.argv.includes("--force");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, "..", "assets", "audio", "music"), { recursive: true });

for (const [filename, samples] of Object.entries(sounds)) {
  const filePath = path.join(OUT_DIR, filename);
  if (!force && fs.existsSync(filePath)) {
    console.log(`Skip ${filename} (already on disk; pass --force to replace)`);
    continue;
  }
  if (force && fs.existsSync(filePath)) {
    const archived = archiveExistingAudio(filePath);
    if (archived) {
      console.log(`Archived previous clip -> ${archived}`);
    }
  }
  writeWav(filePath, samples);
  console.log(`Wrote ${filename}`);
}

console.log("Done.");
