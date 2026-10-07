import { createRequire } from "module";

const require = createRequire(__filename);

interface LintFinding {
  file: string;
  ruleId: string;
  line: number;
  column: number;
  message?: string;
  reason?: string;
}

interface LintClassification {
  unexpected: LintFinding[];
  stale: LintFinding[];
  allowedCount: number;
}

const ciLint = require("../scripts/ci-lint.js") as {
  classifyLintFindings: (
    findings: LintFinding[],
    allow: Map<string, LintFinding>
  ) => LintClassification;
  findingKey: (finding: LintFinding) => string;
};

function allowList(entries: LintFinding[]): Map<string, LintFinding> {
  return new Map(entries.map((entry) => [ciLint.findingKey(entry), entry]));
}

describe("ci lint baseline", () => {
  const known: LintFinding = {
    file: "app/difficulty.tsx",
    ruleId: "react-hooks/set-state-in-effect",
    line: 37,
    column: 7,
    reason: "known",
  };

  it("allows repeated reports of a known location", () => {
    const result = ciLint.classifyLintFindings(
      [
        { ...known, message: "first" },
        { ...known, message: "duplicate" },
      ],
      allowList([known])
    );

    expect(result.unexpected).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.allowedCount).toBe(1);
  });

  it("fails when a finding is not in the baseline", () => {
    const result = ciLint.classifyLintFindings(
      [
        {
          file: "app/game.tsx",
          ruleId: "no-undef",
          line: 1,
          column: 1,
          message: "new",
        },
      ],
      allowList([known])
    );

    expect(result.unexpected).toHaveLength(1);
    expect(result.unexpected[0]?.file).toBe("app/game.tsx");
    expect(result.stale).toEqual([known]);
  });
});
