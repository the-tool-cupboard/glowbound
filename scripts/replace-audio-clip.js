/**
 * Replace a bundled audio clip, archiving the previous file first.
 *
 *   node scripts/replace-audio-clip.js --target assets/audio/sfx/ui-tap.wav --source "C:\path\to\take.mp3" --seconds 2
 *   node scripts/replace-audio-clip.js --target assets/audio/music/menu-theme.wav --source "C:\path\to\take.mp3" --loop-fade
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { archiveExistingAudio, saveSourceCopy } = require("./audioArchive");

function findFfmpeg(name) {
  const extras = [process.env.Path, process.env.PATH, "C:\\ffmpeg\\bin"].filter(Boolean).join(path.delimiter);
  for (const dir of extras.split(path.delimiter)) {
    const candidate = path.join(dir, `${name}.exe`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return name;
}

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || !process.argv[index + 1]) {
    return null;
  }
  return process.argv[index + 1];
}

const source = argValue("--source");
const targetArg = argValue("--target");
const secondsArg = argValue("--seconds");
const seconds = secondsArg == null ? null : Number.parseFloat(secondsArg);
const loopFade = process.argv.includes("--loop-fade");

if (!source || !targetArg || (secondsArg != null && (!Number.isFinite(seconds) || seconds <= 0))) {
  console.error(
    "Usage: node scripts/replace-audio-clip.js --target <wav> --source <file> [--seconds 2] [--loop-fade]"
  );
  process.exit(1);
}

const target = path.resolve(targetArg);
if (!fs.existsSync(source)) {
  console.error(`Source not found: ${source}`);
  process.exit(1);
}

const ffmpeg = findFfmpeg("ffmpeg");
const ffprobe = findFfmpeg("ffprobe");

function probeDuration(filePath) {
  const raw = execFileSync(
    ffprobe,
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" }
  );
  return Number.parseFloat(raw.trim());
}

const clipDuration = seconds ?? probeDuration(source);
if (!Number.isFinite(clipDuration) || clipDuration <= 0) {
  console.error("Could not determine source duration.");
  process.exit(1);
}

const archived = archiveExistingAudio(target);
if (archived) {
  console.log(`Archived previous clip -> ${archived}`);
}

const sourceCopy = saveSourceCopy(source, path.basename(target));
console.log(`Saved source take -> ${sourceCopy}`);

fs.mkdirSync(path.dirname(target), { recursive: true });

let fadeFilter = null;
if (loopFade) {
  const fadeIn = Math.min(0.35, clipDuration * 0.08);
  const fadeOut = Math.min(0.45, clipDuration * 0.08);
  const fadeOutStart = Math.max(0, clipDuration - fadeOut);
  fadeFilter = `afade=t=in:st=0:d=${fadeIn.toFixed(3)},afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}`;
} else if (seconds != null) {
  const fadeOut = Math.min(0.08, clipDuration * 0.2);
  const fadeOutStart = Math.max(0, clipDuration - fadeOut);
  fadeFilter = `afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}`;
}

const ffmpegArgs = ["-y", "-ss", "0", "-t", clipDuration.toFixed(3), "-i", source, "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2"];
if (fadeFilter) {
  ffmpegArgs.push("-af", fadeFilter);
}
ffmpegArgs.push(target);

execFileSync(ffmpeg, ffmpegArgs, { stdio: "inherit" });

console.log(`Wrote ${clipDuration.toFixed(2)}s clip -> ${target}`);
