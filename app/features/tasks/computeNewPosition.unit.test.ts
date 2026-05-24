import { describe, expect, test } from "vitest";
import { computeNewPosition } from "./computeNewPosition";

describe("computeNewPosition", () => {
  test("empty column → first position is 1024", () => {
    expect(computeNewPosition([], 0)).toBe(1024);
  });

  test("drop at end → last.position + 1024", () => {
    expect(computeNewPosition([1024], 1)).toBe(2048);
    expect(computeNewPosition([1024, 2048, 3072], 3)).toBe(4096);
  });

  test("drop at start → halves the first position", () => {
    expect(computeNewPosition([1024], 0)).toBe(512);
    expect(computeNewPosition([2048, 4096], 0)).toBe(1024);
  });

  test("drop in the middle → midpoint of neighbours", () => {
    expect(computeNewPosition([1024, 2048], 1)).toBe(1536);
    expect(computeNewPosition([1024, 2048, 3072], 2)).toBe(2560);
  });

  test("clamps targetIndex below zero to 0", () => {
    expect(computeNewPosition([1024, 2048], -5)).toBe(512);
  });

  test("clamps targetIndex past the end to length", () => {
    expect(computeNewPosition([1024, 2048], 99)).toBe(3072);
  });

  test("can halve repeatedly without underflow at MVP scale", () => {
    let positions = [1024];
    for (let i = 0; i < 10; i++) {
      const next = computeNewPosition(positions, 0);
      expect(next).toBeGreaterThan(0);
      positions = [next, ...positions];
    }
  });

  test("handles a near-zero head by stepping below the first position", () => {
    // If first.position were very small, halving could round-trip to 0
    // depending on float precision; the function should step below
    // instead. Use a deliberately tiny number to exercise the branch.
    const tiny = Number.MIN_VALUE;
    expect(computeNewPosition([tiny], 0)).toBeLessThan(tiny);
  });
});
