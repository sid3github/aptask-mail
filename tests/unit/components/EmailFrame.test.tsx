import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmailFrame } from "@/components/email/EmailFrame";

function srcdoc(container: HTMLElement): string {
  return container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";
}

describe("EmailFrame", () => {
  it("renders a sandboxed iframe that cannot run scripts", () => {
    const { container } = render(<EmailFrame html="<p>hi</p>" />);
    const sandbox = container.querySelector("iframe")?.getAttribute("sandbox") ?? "";
    expect(sandbox).toContain("allow-same-origin");
    expect(sandbox).not.toContain("allow-scripts");
  });

  it("wraps content in a document with target=_blank links and the body html", () => {
    const { container } = render(<EmailFrame html="<p>Hello world</p>" />);
    const doc = srcdoc(container);
    expect(doc).toMatch(/<base[^>]*target="_blank"/i);
    expect(doc).toContain("<p>Hello world</p>");
  });

  it("blocks remote images by default and offers a show-images control", () => {
    const { container } = render(
      <EmailFrame html='<img src="https://tracker.example.com/pixel.gif">' />,
    );
    const doc = srcdoc(container);
    // No <img> may keep an active src= attribute (it's renamed, not removed).
    expect(doc).not.toMatch(/<img[^>]*\ssrc=/i);
    expect(doc).toMatch(/data-blocked-src/);
    expect(screen.getByRole("button", { name: /show images/i })).toBeInTheDocument();
  });

  it("restores remote images after the user opts in", () => {
    const { container } = render(
      <EmailFrame html='<img src="https://cdn.example.com/logo.png">' />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show images/i }));
    expect(srcdoc(container)).toMatch(/src="https:\/\/cdn\.example\.com\/logo\.png"/);
  });

  it("keeps inline data: images untouched", () => {
    const { container } = render(
      <EmailFrame html='<img src="data:image/png;base64,AAAA">' />,
    );
    expect(srcdoc(container)).toMatch(/src="data:image\/png/);
    expect(screen.queryByRole("button", { name: /show images/i })).toBeNull();
  });
});
