/**
 * Runs `expo lint` (app/ and components/) and fails on any finding that is not
 * covered by scripts/lint-baseline.json.
 *
 * A baseline entry is a file, a rule, and how many distinct lines that pair may
 * occupy. Repeated messages on one line count once, so a line move stays inside
 * the allowance. A new line, file, or rule fails the job.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const baselinePath = path.join(__dirname, "lint-baseline.json");

function pairKey(entry) {
  return `${entry.file}\0${entry.ruleId}`;
}

function distinctLines(findings) {
  return [...new Set(findings.map((finding) => finding.line))].sort((a, b) => a - b);
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
      !Number.isInteger(entry.count) ||
      entry.count < 1
    ) {
      throw new Error(`Invalid baseline entry: ${JSON.stringify(entry)}`);
    }
    const key = pairKey(entry);
    if (allow.has(key)) {
      throw new Error(`Duplicate baseline entry for ${entry.file} ${entry.ruleId}`);
    }
    allow.set(key, entry);
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
  const groups = new Map();
  for (const finding of findings) {
    const key = pairKey(finding);
    const group = groups.get(key);
    if (group) {
      group.push(finding);
    } else {
      groups.set(key, [finding]);
    }
  }

  const unexpected = [];
  const matched = [];
  const seen = new Set();
  let allowedCount = 0;

  for (const [key, group] of groups) {
    const lines = distinctLines(group);
    const entry = allow.get(key);
    if (!entry || lines.length > entry.count) {
      unexpected.push(...group);
      if (entry) {
        seen.add(key);
      }
      continue;
    }
    seen.add(key);
    allowedCount += lines.length;
    matched.push({ entry, lines });
  }

  const stale = [];
  const reduced = [];
  for (const [key, entry] of allow) {
    if (!seen.has(key)) {
      stale.push(entry);
      continue;
    }
    const match = matched.find((item) => pairKey(item.entry) === key);
    if (match && match.lines.length < entry.count) {
      reduced.push({ entry, observed: match.lines.length });
    }
  }

  return { unexpected, stale, reduced, matched, allowedCount };
}

function formatFinding(finding) {
  const detail = finding.message ? ` — ${finding.message}` : "";
  return `  ${finding.file}:${finding.line}:${finding.column} ${finding.ruleId}${detail}`;
}

function formatAllowance(entry, lines) {
  const where =
    lines.length === 0
      ? ""
      : lines.length === 1
        ? ` on line ${lines[0]}`
        : ` on lines ${lines.join(", ")}`;
  const reason = entry.reason ? ` — ${entry.reason}` : "";
  return `  ${entry.file} ${entry.ruleId}${where} (${lines.length}/${entry.count})${reason}`;
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
  const { unexpected, stale, reduced, matched, allowedCount } = classifyLintFindings(
    findings,
    allow
  );

  console.log(
    `Lint scanned app/ and components/ (${findings.length} message${findings.length === 1 ? "" : "s"}).`
  );
  console.log(`Allowed known findings: ${allowedCount} distinct line${allowedCount === 1 ? "" : "s"}.`);
  for (const { entry, lines } of matched) {
    console.log(formatAllowance(entry, lines));
  }

  if (reduced.length > 0) {
    console.log("Baseline allows more lines than this run reported (safe to lower the count):");
    for (const { entry, observed } of reduced) {
      console.log(`  ${entry.file} ${entry.ruleId} observed ${observed}, allows ${entry.count}`);
    }
  }

  if (stale.length > 0) {
    console.log("Baseline entries not reported this run (safe to delete when you next edit the baseline):");
    for (const entry of stale) {
      console.log(formatAllowance(entry, []));
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
  distinctLines,
  pairKey,
};
