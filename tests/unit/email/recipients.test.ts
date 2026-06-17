import { describe, it, expect } from "vitest";
import { parseRecipients } from "@/lib/email/recipients";

describe("parseRecipients", () => {
  it("splits a comma-separated list of bare emails", () => {
    expect(parseRecipients("a@b.com, c@d.com")).toEqual([
      { email: "a@b.com" },
      { email: "c@d.com" },
    ]);
  });

  it("parses name + angle-bracket addresses and mixed separators", () => {
    expect(parseRecipients("Sarah Chen <sarah@acme.com>; bob@x.com")).toEqual([
      { name: "Sarah Chen", email: "sarah@acme.com" },
      { email: "bob@x.com" },
    ]);
  });

  it("dedupes case-insensitively by email", () => {
    expect(parseRecipients("a@b.com, A@B.com")).toEqual([{ email: "a@b.com" }]);
  });

  it("drops entries that aren't valid emails", () => {
    expect(parseRecipients("notanemail, real@x.com, also bad")).toEqual([
      { email: "real@x.com" },
    ]);
  });

  it("returns empty for blank input", () => {
    expect(parseRecipients("   ")).toEqual([]);
    expect(parseRecipients("")).toEqual([]);
  });
});
