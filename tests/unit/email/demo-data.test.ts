import { describe, it, expect } from "vitest";
import { DEMO_MESSAGES } from "@/lib/email/demo-data";

describe("demo dataset", () => {
  it("covers all 5 priority labels", () => {
    const labels = new Set(DEMO_MESSAGES.map((m) => m.ai?.priority));
    for (const required of ["urgent", "important", "newsletter", "promo", "other"]) {
      expect(labels.has(required as "urgent")).toBe(true);
    }
  });

  it("has unique IDs", () => {
    const ids = new Set(DEMO_MESSAGES.map((m) => m.id));
    expect(ids.size).toBe(DEMO_MESSAGES.length);
  });

  it("every message has a 1-line AI summary", () => {
    for (const m of DEMO_MESSAGES) {
      expect(m.ai?.summary).toBeTruthy();
      expect(m.ai!.summary!.length).toBeLessThan(120);
    }
  });
});
