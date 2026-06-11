import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("runs the test pipeline", () => {
    expect(1 + 1).toBe(2);
  });
});
