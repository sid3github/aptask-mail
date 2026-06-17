import { describe, it, expect } from "vitest";
import { providerBrand } from "@/lib/email/provider-brand";

describe("providerBrand", () => {
  it("derives the brand from a real provider-prefixed id", () => {
    expect(providerBrand({ id: "gmail:abc", accountId: "x" })).toBe("gmail");
    expect(providerBrand({ id: "graph:abc", accountId: "x" })).toBe("outlook");
    expect(providerBrand({ id: "imap:acct:42", accountId: "x" })).toBe("imap");
  });

  it("derives the brand from the demo accountId", () => {
    expect(providerBrand({ id: "demo:1", accountId: "demo:gmail" })).toBe("gmail");
    expect(providerBrand({ id: "demo:2", accountId: "demo:outlook" })).toBe("outlook");
    expect(providerBrand({ id: "demo:3", accountId: "demo:yahoo" })).toBe("yahoo");
  });

  it("returns null when the source can't be determined", () => {
    expect(providerBrand({ id: "demo:9", accountId: "demo:other" })).toBeNull();
  });
});
