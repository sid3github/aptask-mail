"use client";
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

// A minimal light document the email HTML is rendered into. `<base target=_blank>`
// makes every link open in a new tab; the CSS keeps wide marketing tables and
// images inside the reading column.
const HEAD = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>
  :root{color-scheme:light}
  html,body{margin:0;padding:0;background:#fff;color:#18181b}
  body{padding:20px 22px;font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;word-break:break-word;overflow-wrap:break-word}
  img{max-width:100%;height:auto}
  img[data-blocked-src]{visibility:hidden}
  a{color:#2563eb}
  table{max-width:100%!important}
  blockquote{margin:0 0 0 .25rem;padding-left:1rem;border-left:2px solid #e4e4e7;color:#71717a}
</style></head><body>`;
const TAIL = `</body></html>`;

// True if the html pulls images or backgrounds from a remote origin.
function hasRemoteImages(html: string): boolean {
  return (
    /<img\b[^>]*\bsrc\s*=\s*["']?https?:/i.test(html) ||
    /url\(\s*["']?https?:/i.test(html)
  );
}

// Replace remote <img src> with an inert data attribute and drop remote
// background-image urls, so nothing is fetched until the user opts in.
function blockRemoteImages(html: string): string {
  return html
    .replace(/<img\b[^>]*>/gi, (tag) =>
      /\bsrc\s*=\s*["']?\s*(data:|cid:)/i.test(tag)
        ? tag
        : tag.replace(/\bsrc=/i, "data-blocked-src="),
    )
    .replace(/background(-image)?\s*:\s*url\([^)]*\)/gi, "");
}

export function EmailFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [showImages, setShowImages] = useState(false);
  const remote = hasRemoteImages(html);
  const doc = `${HEAD}${showImages || !remote ? html : blockRemoteImages(html)}${TAIL}`;

  // Size the iframe to its content so there is no inner scrollbar; re-measure as
  // late content (images) loads.
  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let ro: ResizeObserver | undefined;
    const measure = () => {
      const d = iframe.contentDocument;
      if (!d) return;
      const h = Math.max(
        d.documentElement?.scrollHeight ?? 0,
        d.body?.scrollHeight ?? 0,
      );
      if (h > 0) iframe.style.height = `${h + 8}px`;
    };
    const onLoad = () => {
      measure();
      const body = iframe.contentDocument?.body;
      if (body && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(measure);
        ro.observe(body);
      }
    };
    iframe.addEventListener("load", onLoad);
    measure();
    return () => {
      iframe.removeEventListener("load", onLoad);
      ro?.disconnect();
    };
  }, [doc]);

  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-white">
      {remote && !showImages && (
        <button
          type="button"
          onClick={() => setShowImages(true)}
          className="flex w-full items-center justify-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <ImageOff size={13} />
          Images hidden to protect your privacy — show images
        </button>
      )}
      <iframe
        ref={ref}
        title="Email message"
        // No allow-scripts: even markup that slips past server sanitization
        // cannot execute. allow-same-origin lets us measure content height.
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        srcDoc={doc}
        className="block w-full"
        style={{ height: 0, border: 0 }}
      />
    </div>
  );
}
