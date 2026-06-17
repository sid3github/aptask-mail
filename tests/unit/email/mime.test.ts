import { describe, it, expect } from "vitest";
import { buildMimeMessage } from "@/lib/email/mime";
import type { DraftMessage } from "@/lib/email/providers/types";

const base: DraftMessage = {
  accountId: "a",
  to: [{ email: "to@x.com" }],
  subject: "Hello",
  bodyText: "Hi there",
};

describe("buildMimeMessage", () => {
  it("builds a single text/plain message when there are no attachments", () => {
    const raw = buildMimeMessage(base);
    expect(raw).toMatch(/^To: to@x\.com/m);
    expect(raw).toMatch(/^Subject: Hello/m);
    expect(raw).toMatch(/Content-Type: text\/plain; charset=UTF-8/);
    expect(raw).not.toMatch(/multipart\/mixed/);
    expect(raw).toContain("Hi there");
  });

  it("uses text/html when bodyHtml is present", () => {
    const raw = buildMimeMessage({ ...base, bodyHtml: "<p>Hi</p>" });
    expect(raw).toMatch(/Content-Type: text\/html; charset=UTF-8/);
    expect(raw).toContain("<p>Hi</p>");
  });

  it("emits multipart/mixed with a base64 attachment part", () => {
    const raw = buildMimeMessage(
      {
        ...base,
        attachments: [
          { filename: "report.pdf", contentType: "application/pdf", dataBase64: "QUJD" },
        ],
      },
      "BOUND",
    );
    expect(raw).toContain('Content-Type: multipart/mixed; boundary="BOUND"');
    expect(raw).toContain("--BOUND");
    expect(raw).toContain('Content-Disposition: attachment; filename="report.pdf"');
    expect(raw).toContain("Content-Transfer-Encoding: base64");
    expect(raw).toContain("QUJD");
    expect(raw.trimEnd()).toMatch(/--BOUND--$/);
  });

  it("includes Cc when present", () => {
    const raw = buildMimeMessage({ ...base, cc: [{ name: "Cee", email: "cc@x.com" }] });
    expect(raw).toMatch(/^Cc: Cee <cc@x\.com>/m);
  });
});
