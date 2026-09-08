const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { archiveExistingAudio } = require("./audioArchive");

function findFfmpeg(name) {
  const extras = [
    process.env.Path,
    process.env.PATH,
    "C:\\ffmpeg\\bin",
  ]
    .filter(Boolean)
    .join(path.delimiter);
  const parts = extras.split(path.delimiter);
  for (const dir of parts) {
    const candidate = path.join(dir, `${name}.exe`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return name;
}

const ffmpeg = findFfmpeg("ffmpeg");
const ffprobe = findFfmpeg("ffprobe");

function run(bin, args) {
  return execFileSync(bin, args, { encoding: "utf8" });
}

function download(url, dest) {
  execFileSync("curl.exe", ["-L", "--fail", "-o", dest, url], { stdio: "inherit" });
}

function extractWav(videoPath, wavPath) {
  run(ffmpeg, ["-y", "-i", videoPath, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", wavPath]);
}

function detectStartSeconds(wavPath) {
  let log = "";
  try {
    execFileSync(
      ffmpeg,
      ["-i", wavPath, "-af", "silencedetect=noise=-32dB:d=0.04", "-f", "null", "-"],
      { encoding: "utf8", stdio: ["ignore", "ignore", "pipe"] }
    );
  } catch (error) {
    log = error.stderr || "";
  }
  const ends = [...log.matchAll(/silence_end:\s*([0-9.]+)/g)].map((match) => Number.parseFloat(match[1]));
  if (ends.length > 0 && Number.isFinite(ends[0])) {
    return Math.max(0, ends[0] - 0.01);
  }
  return 0;
}

function trimWav(src, dest, keepMs, startSeconds) {
  const keepSec = Math.max(0.08, keepMs / 1000);
  const fadeOutStart = Math.max(0.02, keepSec - 0.03);
  run(ffmpeg, [
    "-y",
    "-ss",
    startSeconds.toFixed(3),
    "-t",
    keepSec.toFixed(3),
    "-i",
    src,
    "-af",
    `afade=t=in:d=0.008,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.025`,
    dest,
  ]);
}

function fadeLoop(src, dest) {
  run(ffmpeg, [
    "-y",
    "-i",
    src,
    "-af",
    "afade=t=in:st=0:d=0.35,afade=t=out:st=9.55:d=0.45",
    dest,
  ]);
}

function processJob(job, videoUrl) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gb-kling-"));
  const mp4 = path.join(tmpDir, `${job.id}.mp4`);
  const fullWav = path.join(tmpDir, `${job.id}-full.wav`);
  const destDir =
    job.kind === "bgm"
      ? path.join(process.cwd(), "assets", "audio", "music")
      : path.join(process.cwd(), "assets", "audio", "sfx");
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, job.filename);
  const archived = archiveExistingAudio(dest);
  if (archived) {
    console.log(`Archived previous clip -> ${archived}`);
  }

  download(videoUrl, mp4);
  extractWav(mp4, fullWav);

  if (job.kind === "bgm") {
    fadeLoop(fullWav, dest);
  } else {
    const start = detectStartSeconds(fullWav);
    trimWav(fullWav, dest, job.keepMs, start);
  }

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // temp cleanup is best-effort
  }

  return dest;
}

module.exports = { processJob, download, extractWav };
