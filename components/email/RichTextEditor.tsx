"use client";
import { useEffect, useRef } from "react";
import { Bold, Italic, List, Link2 } from "lucide-react";

// A deliberately small rich-text surface — bold / italic / bullets / link.
// contentEditable + execCommand is the lightest path that produces clean HTML
// without pulling in an editor framework. Output is sanitized server-side
// before it's ever sent.
export function RichTextEditor({
  html,
  onChange,
  placeholder,
}: {
  html: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Seed external updates (AI draft, reply/forward prefill) — but only when the
  // editor isn't focused, so live typing never loses the caret.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [html]);

  function handleTool(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault(); // keep the editor's selection/focus
    const cmd = e.currentTarget.dataset.cmd;
    if (!cmd) return;
    const el = ref.current;
    el?.focus();
    if (cmd === "createLink") {
      const url = window.prompt("Link URL");
      if (url) document.execCommand("createLink", false, url);
    } else {
      document.execCommand(cmd);
    }
    if (el) onChange(el.innerHTML, el.innerText);
  }

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    onChange(e.currentTarget.innerHTML, e.currentTarget.innerText);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface transition-colors focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/15">
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
        <Tool cmd="bold" label="Bold" onMouseDown={handleTool}><Bold size={15} /></Tool>
        <Tool cmd="italic" label="Italic" onMouseDown={handleTool}><Italic size={15} /></Tool>
        <Tool cmd="insertUnorderedList" label="Bulleted list" onMouseDown={handleTool}>
          <List size={15} />
        </Tool>
        <Tool cmd="createLink" label="Insert link" onMouseDown={handleTool}>
          <Link2 size={15} />
        </Tool>
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Message body"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[240px] px-4 py-3 text-[15px] leading-relaxed text-fg outline-none [&_a]:text-accent [&_a]:underline [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&:empty::before]:text-fg-subtle [&:empty::before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
}

function Tool({
  children,
  cmd,
  label,
  onMouseDown,
}: {
  children: React.ReactNode;
  cmd: string;
  label: string;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-cmd={cmd}
      aria-label={label}
      title={label}
      onMouseDown={onMouseDown}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  );
}
