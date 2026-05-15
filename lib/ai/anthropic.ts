import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Configure it in .env.local or Vercel project settings.");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

// Models — keep version-tagged so the codebase doesn't silently drift.
export const MODEL_HAIKU = "claude-haiku-4-5-20251001";
export const MODEL_SONNET = "claude-sonnet-4-6";

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
