// Canonical, provider-agnostic email model. The UI consumes only these types.
// See docs/architecture.md for the provider abstraction.

export type ProviderId = "gmail" | "graph" | "imap";

export type EmailAddress = {
  name?: string;
  email: string;
};

export type NormalizedLabel =
  | "INBOX"
  | "SENT"
  | "DRAFT"
  | "ARCHIVE"
  | "TRASH"
  | "SPAM"
  | "STARRED"
  | "UNREAD"
  | "IMPORTANT"
  | (string & { readonly __brand?: "custom" });

export type AiPriority =
  | "urgent"
  | "important"
  | "newsletter"
  | "promo"
  | "other";

export type EmailMessage = {
  id: string; // provider-prefixed, e.g. "gmail:abc123"
  accountId: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  snippet: string;
  bodyHtml?: string;
  bodyText?: string;
  date: string; // ISO 8601
  unread: boolean;
  starred: boolean;
  labels: string[];
  hasAttachments: boolean;
  ai?: {
    summary?: string;
    priority?: AiPriority;
    priorityReason?: string;
  };
};

export type DraftMessage = {
  accountId: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyHtml?: string;
  bodyText: string;
  inReplyToMessageId?: string;
  threadId?: string;
};

export type ListOptions = {
  label?: string;
  query?: string;
  cursor?: string;
  limit?: number;
};

export type ListResult = {
  items: EmailMessage[];
  nextCursor?: string;
};

export type ModifyOp =
  | { type: "addLabel"; label: string }
  | { type: "removeLabel"; label: string }
  | { type: "markRead"; read: boolean }
  | { type: "star"; starred: boolean }
  | { type: "archive" }
  | { type: "trash" }
  | { type: "untrash" };

export interface EmailProvider {
  id: ProviderId;
  accountId: string;
  listMessages(opts: ListOptions): Promise<ListResult>;
  getMessage(id: string): Promise<EmailMessage>;
  sendMessage(draft: DraftMessage): Promise<{ id: string }>;
  modifyMessage(id: string, op: ModifyOp): Promise<void>;
  search(query: string, limit?: number): Promise<EmailMessage[]>;
}

export class TokenExpiredError extends Error {
  constructor(message = "OAuth access token expired") {
    super(message);
    this.name = "TokenExpiredError";
  }
}

export class ProviderError extends Error {
  constructor(
    public provider: ProviderId,
    public code: string,
    message: string,
  ) {
    super(`[${provider}:${code}] ${message}`);
    this.name = "ProviderError";
  }
}
