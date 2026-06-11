import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

// Canário do alias: garante que testes resolvem "@/" igual ao app.
describe("alias @/", () => {
  it("resolve imports de src/", () => {
    expect(cn("a", "b")).toBe("a b");
  });
});
