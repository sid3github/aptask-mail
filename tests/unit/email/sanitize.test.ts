import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/email/providers/sanitize";

describe("sanitizeHtml", () => {
  it("strips <script> tags and their contents", () => {
    const out = sanitizeHtml('<p>hi</p><script>alert("xss")</script>');
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toContain("alert");
    expect(out).toContain("<p>hi</p>");
  });

  it("strips inline event handlers like onerror", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toContain("alert");
    // the <img> element itself is benign and preserved
    expect(out).toMatch(/<img/i);
  });

  it("strips javascript: URLs from links", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
    expect(out).toContain("click");
  });

  it("preserves safe markup and attributes", () => {
    const html = '<p>Hello <a href="https://example.com">link</a></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("passes through undefined unchanged", () => {
    expect(sanitizeHtml(undefined)).toBeUndefined();
  });
});
