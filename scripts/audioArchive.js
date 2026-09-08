const fs = require("fs");
const path = require("path");

const AUDIO_ROOT = path.join(__dirname, "..", "assets", "audio");
const ARCHIVE_ROOT = path.join(AUDIO_ROOT, "archive");

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function uniquePath(destDir, base, ext) {
  const stamped = path.join(destDir, `${base}-${timestamp()}${ext}`);
  if (!fs.existsSync(stamped)) {
    return stamped;
  }
  return path.join(destDir, `${base}-${timestamp()}-${process.hrtime.bigint()}${ext}`);
}

/**
 * Moves an on-disk clip into assets/audio/archive, keeping sfx/ vs music/.
 * Returns the archive path, or null if there was nothing to move.
 */
function archiveExistingAudio(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const relative = path.relative(AUDIO_ROOT, filePath);
  const kindDir = relative.startsWith("..") ? "other" : path.dirname(relative);
  const destDir = path.join(ARCHIVE_ROOT, kindDir);
  fs.mkdirSync(destDir, { recursive: true });
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const dest = uniquePath(destDir, base, ext);
  fs.renameSync(filePath, dest);
  return dest;
}

/**
 * Copies a source take into archive/sources with the catalog stem (e.g. ui-tap.mp3).
 * Existing source copies are timestamped first so nothing is overwritten.
 */
function saveSourceCopy(sourcePath, catalogFilename) {
  const destDir = path.join(ARCHIVE_ROOT, "sources");
  fs.mkdirSync(destDir, { recursive: true });
  const ext = path.extname(sourcePath) || ".mp3";
  const stem = path.basename(catalogFilename, path.extname(catalogFilename));
  const dest = path.join(destDir, `${stem}${ext}`);
  if (fs.existsSync(dest)) {
    const archived = uniquePath(destDir, stem, ext);
    fs.renameSync(dest, archived);
  }
  fs.copyFileSync(sourcePath, dest);
  return dest;
}

module.exports = { archiveExistingAudio, saveSourceCopy, AUDIO_ROOT, ARCHIVE_ROOT };
