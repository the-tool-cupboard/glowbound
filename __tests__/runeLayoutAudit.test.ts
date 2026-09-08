import { auditAllChapterLevels, formatRuneLayoutAudit } from "../lib/runeLayoutAudit";

describe("runeLayoutAudit", () => {
  it("reports no overlap or clustering issues across the 10-stage curve", () => {
    const findings = auditAllChapterLevels();
    const report = formatRuneLayoutAudit(findings);
    const failed = findings.filter((finding) => finding.issues.length > 0);

    if (failed.length > 0) {
      throw new Error(report);
    }

    expect(report.length).toBeGreaterThan(0);
    expect(failed).toEqual([]);
  });
});
