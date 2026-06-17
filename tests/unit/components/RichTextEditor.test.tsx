import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { RichTextEditor } from "@/components/email/RichTextEditor";

describe("RichTextEditor", () => {
  it("seeds the editor when the html prop changes (AI generate / prefill)", () => {
    const { container, rerender } = render(
      <RichTextEditor html="" onChange={() => {}} placeholder="Write…" />,
    );
    const ed = container.querySelector('[role="textbox"]') as HTMLElement;
    expect(ed.innerHTML).toBe("");

    rerender(
      <RichTextEditor
        html="<p>Hi Sarah,</p><p>Sounds good.</p>"
        onChange={() => {}}
        placeholder="Write…"
      />,
    );
    expect(ed.innerHTML).toBe("<p>Hi Sarah,</p><p>Sounds good.</p>");
  });

  it("emits html + text on input", () => {
    const onChange = vi.fn();
    const { container } = render(<RichTextEditor html="" onChange={onChange} />);
    const ed = container.querySelector('[role="textbox"]') as HTMLElement;
    ed.innerHTML = "<p>typed</p>";
    ed.dispatchEvent(new Event("input", { bubbles: true }));
    // jsdom doesn't implement innerText, so only assert the html arg.
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBe("<p>typed</p>");
  });
});
