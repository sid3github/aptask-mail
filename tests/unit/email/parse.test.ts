import { describe, it, expect } from "vitest";
import { parseAddressList, snippet } from "@/lib/email/providers/parse";

describe("parseAddressList", () => {
  it("parses a single bare email", () => {
    expect(parseAddressList("alice@example.com")).toEqual([
      { email: "alice@example.com" },
    ]);
  });

  it("parses a name + angle-bracket email", () => {
    expect(parseAddressList('"Alice Smith" <alice@example.com>')).toEqual([
      { name: "Alice Smith", email: "alice@example.com" },
    ]);
  });

  it("parses multiple recipients", () => {
    const list = parseAddressList(
      "Alice <a@x.com>, b@x.com, \"C, Bob\" <c@x.com>",
    );
    expect(list).toHaveLength(3);
    expect(list[0]).toMatchObject({ email: "a@x.com" });
    expect(list[1]).toMatchObject({ email: "b@x.com" });
    expect(list[2]).toMatchObject({ email: "c@x.com" });
  });

  it("returns empty for nullish input", () => {
    expect(parseAddressList(undefined)).toEqual([]);
    expect(parseAddressList("")).toEqual([]);
  });
});

describe("snippet", () => {
  it("trims and collapses whitespace", () => {
    expect(snippet("  hello   world\n\nfoo  ")).toBe("hello world foo");
  });
  it("truncates with ellipsis", () => {
    expect(snippet("a".repeat(200), 10)).toBe("aaaaaaaaa…");
  });
});
