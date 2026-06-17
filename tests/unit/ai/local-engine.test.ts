import { describe, it, expect } from "vitest";
import { prioritize } from "@/lib/ai/prioritize";
import { summarize } from "@/lib/ai/summarize";
import { generateDraft } from "@/lib/ai/draft";

describe("prioritize (local rules)", () => {
  it("flags payment/action emails as urgent", async () => {
    const r = await prioritize({
      from: "PayPal <service@paypal.com>",
      subject: "Your payment failed — action required",
      snippet: "Please update your billing details to avoid suspension.",
    });
    expect(r.priority).toBe("urgent");
    expect(r.reason.length).toBeGreaterThan(0);
  });

  it("flags one-time codes as urgent even from a no-reply sender", async () => {
    const r = await prioritize({
      from: "Google <no-reply@accounts.google.com>",
      subject: "Your verification code",
      snippet: "Your one-time code is 123456.",
    });
    expect(r.priority).toBe("urgent");
  });

  it("classifies sale blasts as promo", async () => {
    const r = await prioritize({
      from: "Best Buy <deals@emails.bestbuy.com>",
      subject: "50% off doorbusters this weekend",
      snippet: "Save big — limited time only.",
    });
    expect(r.priority).toBe("promo");
  });

  it("classifies digests as newsletter", async () => {
    const r = await prioritize({
      from: "Morning Brew <crew@morningbrew.com>",
      subject: "Your Tuesday digest",
      snippet: "This week in business and tech. Unsubscribe anytime.",
    });
    expect(r.priority).toBe("newsletter");
  });

  it("classifies a named human + business keyword as important", async () => {
    const r = await prioritize({
      from: "Sarah Chen <sarah@acme.com>",
      subject: "Invoice #1024 for your review",
      snippet: "Please review the attached invoice before Friday.",
    });
    expect(r.priority).toBe("important");
  });

  it("falls back to other for automated transactional mail", async () => {
    const r = await prioritize({
      from: "Amazon <auto-confirm@amazon.com>",
      subject: "Your order has shipped",
      snippet: "Track your package in the app.",
    });
    expect(r.priority).toBe("other");
  });
});

describe("summarize (local extractive)", () => {
  it("strips the greeting and returns the first substantive sentence", async () => {
    const s = await summarize({
      from: "Kotak Bank <noreply@kotak.com>",
      subject: "Scheduled Maintenance activity",
      snippet:
        "Dear Customer, We will undertake scheduled maintenance on Sunday between 1am and 4am. Services may be unavailable.",
    });
    expect(s).not.toMatch(/^Dear Customer/i);
    expect(s).not.toMatch(/^This email/i);
    expect(s).toMatch(/scheduled maintenance/i);
    expect(s.length).toBeLessThanOrEqual(140);
  });

  it("falls back to the subject when there is no snippet", async () => {
    const s = await summarize({
      from: "Sarah <sarah@acme.com>",
      subject: "Team lunch on Friday",
      snippet: "",
    });
    expect(s).toMatch(/Team lunch/i);
  });

  it("never exceeds 140 characters", async () => {
    const s = await summarize({
      from: "x <x@y.com>",
      subject: "long",
      snippet: "word ".repeat(80),
    });
    expect(s.length).toBeLessThanOrEqual(140);
  });
});

describe("generateDraft (local template)", () => {
  const base = {
    previousFrom: "Sarah Chen <sarah@acme.com>",
    previousSubject: "Design review",
    previousBody: "Can you make the 2pm review tomorrow?",
  };

  it("writes a formal reply with greeting, intent and sign-off", async () => {
    const r = await generateDraft({
      ...base,
      intent: "I will attend the 2pm review",
      tone: "formal",
    });
    expect(r.tone).toBe("formal");
    expect(r.body).toMatch(/Sarah/);
    expect(r.body.toLowerCase()).toContain("2pm review");
    expect(r.body).toMatch(/regards|sincerely/i);
  });

  it("writes a casual reply", async () => {
    const r = await generateDraft({
      ...base,
      intent: "sounds good, see you then",
      tone: "casual",
    });
    expect(r.body).toMatch(/^Hi Sarah/);
    // The engine paraphrases a confirmation rather than echoing it verbatim;
    // assert the casual confirm sentiment holds across its phrasing variants.
    expect(r.body).toMatch(/looking forward|see you|count me in|works for me/i);
  });

  it("keeps a short reply terse (no formal sign-off)", async () => {
    const r = await generateDraft({
      ...base,
      intent: "yes, confirmed",
      tone: "short",
    });
    expect(r.body.toLowerCase()).toContain("confirmed");
    expect(r.body).not.toMatch(/best regards/i);
  });
});
