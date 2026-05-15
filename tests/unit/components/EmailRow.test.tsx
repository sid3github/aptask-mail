import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmailRow } from "@/components/email/EmailRow";
import type { EmailMessage } from "@/lib/email/providers/types";

const sample: EmailMessage = {
  id: "demo:1",
  accountId: "a",
  threadId: "t",
  from: { name: "Sarah Chen", email: "sarah@example.com" },
  to: [{ email: "you@x.com" }],
  subject: "Design review tomorrow",
  snippet: "Can you join...",
  date: new Date().toISOString(),
  unread: true,
  starred: false,
  labels: ["INBOX", "UNREAD"],
  hasAttachments: false,
  ai: { summary: "Sarah wants you at tomorrow's 2pm design review.", priority: "important" },
};

describe("EmailRow", () => {
  it("renders sender, subject, summary, and priority", () => {
    render(<EmailRow message={sample} />);
    expect(screen.getByText(/Sarah Chen/)).toBeInTheDocument();
    expect(screen.getByText(/Design review tomorrow/)).toBeInTheDocument();
    expect(screen.getByText(/2pm design review/)).toBeInTheDocument();
    expect(screen.getByText(/Important/i)).toBeInTheDocument();
  });

  it("renders without AI metadata", () => {
    const { container } = render(
      <EmailRow message={{ ...sample, ai: undefined }} />,
    );
    expect(container.textContent).toContain("Sarah Chen");
    expect(container.textContent).not.toContain("Important");
  });
});
