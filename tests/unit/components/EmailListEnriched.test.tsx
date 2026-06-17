import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { EmailListEnriched } from "@/components/email/EmailListEnriched";
import type { EmailMessage } from "@/lib/email/providers/types";

function make(prefix: string, n: number): EmailMessage[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}:${i}`,
    accountId: "a",
    threadId: `t${i}`,
    from: { email: `s${i}@x.com` },
    to: [{ email: "you@x.com" }],
    subject: `Subject ${i}`,
    snippet: "snippet",
    date: new Date(2026, 0, 1).toISOString(),
    unread: false,
    starred: false,
    labels: ["INBOX"],
    hasAttachments: false,
  }));
}

let calls: { items: { id: string }[] }[] = [];

beforeEach(() => {
  localStorage.clear();
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { items: { id: string }[] };
      calls.push(body);
      const results = Object.fromEntries(
        body.items.map((i) => [
          i.id,
          { summary: `S:${i.id}`, priority: "other", priorityReason: "r" },
        ]),
      );
      return { ok: true, status: 200, json: async () => ({ results }) } as Response;
    }),
  );
});

describe("EmailListEnriched", () => {
  it("requests AI enrichment in chunks of at most 25 (the route's cap)", async () => {
    const { container } = render(<EmailListEnriched messages={make("chunk", 30)} />);

    await waitFor(() => {
      expect(calls.length).toBeGreaterThan(0);
      expect(container.querySelectorAll(".skeleton").length).toBe(0);
    });

    // No single request may exceed the route's 25-item cap, or it 400s.
    for (const c of calls) expect(c.items.length).toBeLessThanOrEqual(25);
    // All 30 messages must still be covered across the chunks.
    const ids = new Set(calls.flatMap((c) => c.items.map((i) => i.id)));
    expect(ids.size).toBe(30);
  });

  it("clears skeletons even under StrictMode double-invocation", async () => {
    const { container, findByText } = render(
      <StrictMode>
        <EmailListEnriched messages={make("strict", 5)} />
      </StrictMode>,
    );

    // The summary must actually land — not get stranded behind a cancelled effect.
    await findByText("S:strict:0");
    await waitFor(() =>
      expect(container.querySelectorAll(".skeleton").length).toBe(0),
    );
  });
});
