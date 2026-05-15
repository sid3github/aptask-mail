import { describe, it, expect } from "vitest";
import {
  SUMMARY_SYSTEM,
  PRIORITY_SYSTEM,
  DRAFT_SYSTEM,
  SEARCH_QUERY_SYSTEM,
} from "@/lib/ai/prompts";

describe("prompt invariants", () => {
  it("summary prompt forbids 'This email...'", () => {
    expect(SUMMARY_SYSTEM).toMatch(/No leading "This email\.\.\."/);
  });

  it("priority prompt defines all 5 labels", () => {
    for (const label of ["urgent", "important", "newsletter", "promo", "other"]) {
      expect(PRIORITY_SYSTEM).toContain(label);
    }
  });

  it("draft prompt enforces JSON output", () => {
    expect(DRAFT_SYSTEM).toMatch(/Output JSON only/);
  });

  it("search prompt declares the structured schema", () => {
    expect(SEARCH_QUERY_SYSTEM).toMatch(/subjectKeywords/);
    expect(SEARCH_QUERY_SYSTEM).toMatch(/semanticHint/);
  });
});
