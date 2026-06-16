import createDOMPurify, { type Config, type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";

// DOMPurify needs a DOM to parse against. These providers run on the Node
// server (API routes / server components) where there is no global `window`,
// so we build one with jsdom. The jsdom test environment also satisfies this
// path, giving a single deterministic code path everywhere.
const { window } = new JSDOM("");
const purify = createDOMPurify(window as unknown as WindowLike);

// DOMPurify's defaults already drop <script>, inline event handlers (onerror,
// onclick, ...) and javascript: URLs. We additionally forbid the embedding /
// form tags an email body never legitimately needs and the attributes that can
// smuggle script back in.
const CONFIG: Config = {
  FORBID_TAGS: ["script", "iframe", "object", "embed", "base", "form"],
  FORBID_ATTR: ["srcdoc", "formaction"],
};

/**
 * Sanitize an email HTML body before it is handed to the client. Strips
 * scripts, event handlers and other XSS vectors while preserving normal
 * formatting markup. Passes `undefined` through so providers can call it on an
 * optional `bodyHtml` without branching.
 */
export function sanitizeHtml(html: string | undefined): string | undefined {
  if (html == null) return undefined;
  return purify.sanitize(html, CONFIG);
}
