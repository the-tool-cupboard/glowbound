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

interface BaselineEntry {
  file: string;
  ruleId: string;
  count: number;
  reason?: string;
}

interface LintClassification {
  unexpected: LintFinding[];
  stale: BaselineEntry[];
  reduced: Array<{ entry: BaselineEntry; observed: number }>;
  allowedCount: number;
}

const ciLint = require("../scripts/ci-lint.js") as {
  classifyLintFindings: (
    findings: LintFinding[],
    allow: Map<string, BaselineEntry>
  ) => LintClassification;
  pairKey: (entry: { file: string; ruleId: string }) => string;
};

function allowList(entries: BaselineEntry[]): Map<string, BaselineEntry> {
  return new Map(entries.map((entry) => [ciLint.pairKey(entry), entry]));
}

describe("ci lint baseline", () => {
  const known: BaselineEntry = {
    file: "app/difficulty.tsx",
    ruleId: "react-hooks/set-state-in-effect",
    count: 1,
    reason: "known",
  };

  function finding(line: number, column = 7): LintFinding {
    return {
      file: known.file,
      ruleId: known.ruleId,
      line,
      column,
      message: "setState in effect",
    };
  }

  it("counts repeated reports of one line as a single finding", () => {
    const result = ciLint.classifyLintFindings(
      [finding(37, 7), finding(37, 7)],
      allowList([known])
    );

    expect(result.unexpected).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.reduced).toEqual([]);
    expect(result.allowedCount).toBe(1);
  });

  it("allows a known finding after its line moves", () => {
    const result = ciLint.classifyLintFindings([finding(240, 3)], allowList([known]));

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

  it("fails when the same file and rule occupy more lines than allowed", () => {
    const result = ciLint.classifyLintFindings(
      [finding(37), finding(90)],
      allowList([known])
    );

    expect(result.unexpected.map((item) => item.line)).toEqual([37, 90]);
    expect(result.stale).toEqual([]);
    expect(result.allowedCount).toBe(0);
  });

  it("allows several lines when the count covers them", () => {
    const result = ciLint.classifyLintFindings(
      [finding(32), finding(80), finding(32)],
      allowList([{ ...known, count: 2 }])
    );

    expect(result.unexpected).toEqual([]);
    expect(result.reduced).toEqual([]);
    expect(result.allowedCount).toBe(2);
  });

  it("stays green when fewer lines are reported than the allowance", () => {
    const allowance: BaselineEntry = { ...known, count: 3 };
    const result = ciLint.classifyLintFindings([finding(40)], allowList([allowance]));

    expect(result.unexpected).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.reduced).toEqual([{ entry: allowance, observed: 1 }]);
    expect(result.allowedCount).toBe(1);
  });
});
