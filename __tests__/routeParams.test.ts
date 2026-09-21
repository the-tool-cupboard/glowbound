import { MAX_LEVEL, MAX_STORED_SCORE } from "../lib/gameConfig";
import {
  parseDifficultyParam,
  parsePlayLevel,
  parseRouteParam,
  parseScoreParam,
} from "../lib/routeParams";

describe("parseRouteParam", () => {
  it("uses the first value when expo-router passes an array", () => {
    expect(parseRouteParam(["11", "21"])).toBe("11");
    expect(parseRouteParam("11")).toBe("11");
    expect(parseRouteParam(undefined)).toBeUndefined();
  });
});

describe("parsePlayLevel", () => {
  it("clamps to the 1–MAX_LEVEL range", () => {
    expect(parsePlayLevel("1")).toBe(1);
    expect(parsePlayLevel("100")).toBe(MAX_LEVEL);
    expect(parsePlayLevel("999")).toBe(MAX_LEVEL);
    expect(parsePlayLevel("-4", 7)).toBe(7);
    expect(parsePlayLevel(undefined, 11)).toBe(11);
    expect(parsePlayLevel(["21"])).toBe(21);
  });
});

describe("parseScoreParam", () => {
  it("accepts zero and rejects junk or oversized values", () => {
    expect(parseScoreParam("0")).toBe(0);
    expect(parseScoreParam("40")).toBe(40);
    expect(parseScoreParam("-9")).toBe(0);
    expect(parseScoreParam("nope")).toBe(0);
    expect(parseScoreParam(String(MAX_STORED_SCORE + 50))).toBe(MAX_STORED_SCORE);
  });
});

describe("parseDifficultyParam", () => {
  it("falls back to standard for missing or unknown ids", () => {
    expect(parseDifficultyParam("harsh")).toBe("harsh");
    expect(parseDifficultyParam(["calm"])).toBe("calm");
    expect(parseDifficultyParam("wanderer")).toBe("standard");
    expect(parseDifficultyParam(["hacked", "harsh"])).toBe("standard");
    expect(parseDifficultyParam(undefined)).toBe("standard");
  });
});
