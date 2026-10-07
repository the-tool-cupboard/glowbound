/**
 * Runs `expo lint` (app/ and components/) and fails on any finding that is not
 * listed in scripts/lint-baseline.json. Known findings are printed and allowed
 * so CI can be required on main without rewriting play-session UI.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const baselinePath = path.join(__dirname, "lint-baseline.json");

function findingKey(finding) {
  return [finding.file, finding.ruleId, finding.line, finding.column].join("\0");
}

function loadBaseline() {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  if (!baseline || !Array.isArray(baseline.allow)) {
    throw new Error("scripts/lint-baseline.json must contain an allow array");
  }
  const allow = new Map();
  for (const entry of baseline.allow) {
    if (
      typeof entry.file !== "string" ||
      typeof entry.ruleId !== "string" ||
      typeof entry.line !== "number" ||
      typeof entry.column !== "number"
    ) {
      throw new Error(`Invalid baseline entry: ${JSON.stringify(entry)}`);
    }
    allow.set(findingKey(entry), entry);
  }
  return allow;
}

function collectFindings(report) {
  const findings = [];
  for (const file of report) {
    const filePath = typeof file.filePath === "string" ? file.filePath : "";
    const relative = path.relative(projectRoot, filePath).split(path.sep).join("/");
    for (const message of file.messages ?? []) {
      if (!message || message.severity < 1) {
        continue;
      }
      findings.push({
        file: relative,
        ruleId: message.ruleId ?? "(parse)",
        line: message.line ?? 0,
        column: message.column ?? 0,
        message: String(message.message ?? "").split("\n")[0],
      });
    }
  }
  return findings;
}

function classifyLintFindings(findings, allow) {
  const unexpected = [];
  const seen = new Set();
  for (const finding of findings) {
    const key = findingKey(finding);
    if (allow.has(key)) {
      seen.add(key);
    } else {
      unexpected.push(finding);
    }
  }
  const stale = [];
  for (const [key, entry] of allow) {
    if (!seen.has(key)) {
      stale.push(entry);
    }
  }
  return { unexpected, stale, allowedCount: seen.size };
}

function formatFinding(finding) {
  const reason = finding.reason ? ` — ${finding.reason}` : "";
  const detail = finding.message ? ` — ${finding.message}` : reason;
  return `  ${finding.file}:${finding.line}:${finding.column} ${finding.ruleId}${detail}`;
}

function runExpoLint(reportPath) {
  const expoBin = path.join(projectRoot, "node_modules", ".bin", "expo");
  return spawnSync(
    expoBin,
    ["lint", "--no-cache", "--", "--format", "json", "-o", reportPath],
    {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        CI: "true",
        EXPO_NO_TELEMETRY: "1",
      },
    }
  );
}

function main() {
  const allow = loadBaseline();
  const reportPath = path.join(os.tmpdir(), `glowbound-eslint-${process.pid}.json`);
  const result = runExpoLint(reportPath);

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (!fs.existsSync(reportPath)) {
    console.error("expo lint did not write a JSON report.");
    if (result.stdout) {
      console.error(result.stdout);
    }
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(result.status || 1);
  }

  if (result.status !== 0 && result.status !== 1) {
    console.error(`expo lint exited ${result.status}.`);
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(result.status || 1);
  }

  const findings = collectFindings(JSON.parse(fs.readFileSync(reportPath, "utf8")));
  const { unexpected, stale, allowedCount } = classifyLintFindings(findings, allow);

  console.log(
    `Lint scanned app/ and components/ (${findings.length} message${findings.length === 1 ? "" : "s"}).`
  );
  console.log(`Allowed known findings: ${allowedCount}.`);
  for (const entry of allow.values()) {
    if (!stale.includes(entry)) {
      console.log(formatFinding(entry));
    }
  }

  if (stale.length > 0) {
    console.log("Baseline entries not reported this run (safe to delete when you next edit the baseline):");
    for (const entry of stale) {
      console.log(formatFinding(entry));
    }
  }

  if (unexpected.length > 0) {
    console.error("New lint findings:");
    for (const finding of unexpected) {
      console.error(formatFinding(finding));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  classifyLintFindings,
  collectFindings,
  findingKey,
};
