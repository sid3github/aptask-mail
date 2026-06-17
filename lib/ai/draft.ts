import { z } from "zod";
import { parseFrom } from "./text";

export const DraftInputSchema = z.object({
  // Optional so the same engine serves both reply (with context) and
  // compose-from-scratch (no prior message).
  previousFrom: z.string().default(""),
  previousSubject: z.string().default(""),
  // Long quoted emails must never error. Clamp so a huge forwarded thread
  // degrades gracefully.
  previousBody: z
    .string()
    .default("")
    .transform((s) => s.slice(0, 8000)),
  intent: z.string().min(1).max(500),
  tone: z.enum(["formal", "casual", "short"]).default("casual"),
});
export type DraftInput = z.infer<typeof DraftInputSchema>;

export type DraftOutput = {
  body: string;
  tone: "formal" | "casual" | "short";
};

// ---------------------------------------------------------------------------
// Local draft engine. No network, no API key — it classifies the user's intent
// into a "speech act", pulls out any date/time, and writes a real, varied email
// for it (rather than echoing the prompt back inside "Hi X, <prompt>. Thanks,").
// Phrasing is drawn from per-tone variant pools so "Regenerate" produces a
// genuinely different draft each time.
// ---------------------------------------------------------------------------

type Tone = "formal" | "casual" | "short";
type Act =
  | "reschedule"
  | "cancel"
  | "decline"
  | "confirm"
  | "schedule"
  | "followup"
  | "remind"
  | "apology"
  | "thanks"
  | "request"
  | "inform"
  | "open"
  | "general";

const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const squish = (s: string) =>
  s.replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();

function asSentence(raw: string): string {
  let s = squish(raw);
  if (!s) return s;
  s = cap(s);
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
}

// ---- recipient name --------------------------------------------------------
// Greet by a real first name when we have one. When all we have is an email
// address, derive a tidy first name from the local part (drop trailing digits,
// split on . _ -) — and fall back to a neutral greeting rather than printing
// something like "Hi Siddharthpadwal3,".
function recipientName(from: string): string | null {
  const { name, email } = parseFrom(from);
  if (name) return cap(name.split(/\s+/)[0]);
  if (email) {
    const local = email.split("@")[0].replace(/\d+$/, "");
    const seg = local.split(/[._-]+/).filter(Boolean)[0];
    if (seg && seg.length >= 2 && /[a-z]/i.test(seg)) return cap(seg);
  }
  return null;
}

// ---- date / time extraction ------------------------------------------------
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function extractWhen(intent: string): string | null {
  const t = ` ${intent.toLowerCase()} `;
  let bare = "";
  const rel = t.match(
    /\b(tomorrow|today|tonight|this (?:week|morning|afternoon|evening|weekend)|next (?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|the weekend|end of (?:the )?(?:day|week))\b/,
  );
  if (rel) bare = rel[1];
  else {
    const d = DAYS.find((x) => t.includes(x));
    if (d) bare = d;
  }
  const tm = t.match(/\b(\d{1,2}(?::\d{2})?\s?(?:a\.?m\.?|p\.?m\.?)|\d{1,2}:\d{2})\b/);
  if (tm) {
    const time = tm[1].replace(/\s+/g, "").replace(/\./g, "");
    bare = bare ? `${bare} at ${time}` : `at ${time}`;
  }
  if (!bare) return null;
  // Capitalise any weekday inside the phrase.
  return bare.replace(new RegExp(`\\b(${DAYS.join("|")})\\b`, "g"), (m) => cap(m));
}

type When = { bare: string; to: string; on: string };

function buildWhen(intent: string): When | null {
  const bare = extractWhen(intent);
  if (!bare) return null;
  const noOnPrep = /^(tomorrow|today|tonight|this |next |the weekend|end of|at )/i.test(bare);
  return {
    bare,
    to: /^at /i.test(bare) ? bare : `to ${bare}`,
    on: noOnPrep ? bare : `on ${bare}`,
  };
}

// ---- intent classification -------------------------------------------------
function detectAct(intent: string): Act {
  const t = intent.toLowerCase().trim();
  if (!t || t === "reply appropriately." || t === "write a brief, friendly message.") return "open";
  const has = (re: RegExp) => re.test(t);
  // NOTE: no trailing \b on prefix words like "reschedul" — "reschedule" has a
  // word char ("e") right after, which a trailing boundary would reject.
  if (has(/\b(reschedul|postpone|push (?:it |this |the )?back|move (?:it|this|the|our|to)|shift (?:it|the|our)|(?:another|different) (?:time|day|date)|change (?:the )?(?:time|date|day))/))
    return "reschedule";
  if (has(/\b(cancel|call (?:it|this) off|drop the (?:meeting|call))/)) return "cancel";
  if (has(/\b(declin|can'?t make|cannot make|won'?t be able|will not be able|unable to (?:attend|make|join|come)|have to pass|not able to|won'?t make it)/))
    return "decline";
  if (has(/\b(confirm|i'?ll be there|see you (?:then|there)|works for me|sounds good|count me in|i'?m in|that works|accept|agreed)/))
    return "confirm";
  if (has(/\b(set up (?:a )?(?:meeting|call|time|chat)|schedule (?:a )?(?:meeting|call|chat|time)|book (?:a )?(?:time|slot|call)|find (?:a )?time|hop on (?:a )?call|grab (?:a )?(?:coffee|time)|catch up|meet up|jump on a call)\b/))
    return "schedule";
  if (has(/\b(follow ?up|circl(?:e|ing) back|checking in|check in|any update|status (?:update|on)|touch base|touching base|bump(?:ing)? this|gentle (?:nudge|reminder))\b/))
    return "followup";
  if (has(/^(?:remind|reminder|just a reminder)\b/) || has(/\bdon'?t forget\b/)) return "remind";
  if (has(/\b(apolog|i'?m sorry|so sorry|my (?:apologies|bad)|regret)\b/)) return "apology";
  if (has(/\b(thank|thanks|appreciate|grateful|much obliged)\b/) && !has(/\bno,? thanks\b/)) return "thanks";
  if (has(/^(?:could you|can you|would you|please)\b/) || has(/\b(i need|we need|requesting|send me|share the|pass (?:along|on))\b/))
    return "request";
  if (has(/^(?:let .* know|tell .* (?:that|about)|just (?:a )?heads up|fyi|wanted to let you know|note that|update[: ])/))
    return "inform";
  return "general";
}

// ---- imperative → first person (for general / inform fallbacks) ------------
function firstPerson(raw: string): string {
  const s = squish(raw).replace(/^(please|kindly|just)\s+/i, "");
  const reps: [RegExp, string][] = [
    [/^ask(?:ing)?\s+(?:them|him|her|you|[\w.]+)?\s*(to|about|for|if|whether)\s+/i, "to ask $1 "],
    [/^(?:tell|let)\s+(?:them|him|her|[\w.]+)\s+know\s+(?:that\s+)?/i, "to let you know that "],
    [/^(?:tell|let)\s+(?:them|him|her|[\w.]+)\s+(?:that\s+)?/i, "to let you know that "],
    [/^(?:inform|notify)\s+(?:them|him|her|[\w.]+)?\s*(?:that\s+|about\s+)?/i, "to let you know "],
    [/^send\s+(?:them|him|her|[\w.]+)?\s*/i, "to send over "],
    [/^share\s+/i, "to share "],
    [/^suggest(?:ing)?\s+/i, "to suggest "],
    [/^propose\s+/i, "to propose "],
    [/^offer(?:ing)?\s+/i, "to offer "],
  ];
  for (const [re, rep] of reps) {
    if (re.test(s)) return "I wanted " + lowerFirst(squish(s.replace(re, rep)));
  }
  // Already a first-person / declarative statement ("I will attend…", "The
  // report is ready") — keep it as written; asSentence() handles capitalization.
  return s;
}

// ---- body per act ----------------------------------------------------------
function bodyFor(act: Act, tone: Tone, W: When | null, intent: string, subject: string): string {
  const short = tone === "short";
  const formal = tone === "formal";

  switch (act) {
    case "reschedule": {
      const to = W?.to ?? "to another time";
      if (short) return `Could we reschedule ${to}?`;
      if (formal)
        return pick([
          `I'm writing to ask whether we might reschedule ${to}. My apologies for any inconvenience — I'm happy to work around your availability.`,
          `Would it be possible to move our meeting ${to}? Please let me know if that's convenient, or suggest a time that suits you better.`,
        ]);
      return pick([
        `Something's come up on my end — could we push things ${to}? That would work a lot better for me, but I'm happy to flex around you.`,
        `Would it be possible to move our meeting ${to}? Totally understand if that's tricky — just let me know what works.`,
        `Mind if we reschedule ${to}? Want to make sure I can give it my full attention.`,
      ]);
    }
    case "cancel": {
      const on = W?.on ?? "our plans";
      if (short) return `I need to cancel ${on} — sorry about that.`;
      if (formal)
        return `Unfortunately I need to cancel ${W?.on ?? "our scheduled meeting"}. I apologise for the late notice and hope we can find another time soon.`;
      return `I'm really sorry, but I have to cancel ${on}. Let's find another time that works — I'll follow up shortly.`;
    }
    case "decline": {
      const on = W?.on ? ` ${W.on}` : "";
      if (short) return `Sorry, I won't be able to make it${on}.`;
      if (formal)
        return `Thank you very much for the invitation. Unfortunately I won't be able to attend${on}, but I hope it goes well and would welcome another opportunity.`;
      return `Thanks so much for the invite! Sadly I can't make it${on} — hope it goes great, and let's catch up soon.`;
    }
    case "confirm": {
      const bare = W?.bare;
      const on = W?.on ? ` for ${W.bare}` : "";
      if (short) return `Confirmed${bare ? ` — ${bare}` : ""}. See you then!`;
      if (formal)
        return `Thank you — I'm pleased to confirm${bare ? ` ${bare}` : " the arrangement"}. I look forward to it.`;
      return pick([
        `Sounds great — ${bare ? `${bare} works for me` : "that works for me"}. Looking forward to it!`,
        `Perfect, count me in${on}. See you then!`,
      ]);
    }
    case "schedule": {
      const at = W?.on ? ` ${W.on}` : "";
      if (short) return `Want to set up a quick call${at}?`;
      if (formal)
        return `I'd like to arrange a time to speak${at}. Please let me know what suits you and I'll send an invitation.`;
      return `Want to grab some time to chat${at}? Send over what works for you and I'll fire off an invite.`;
    }
    case "followup": {
      const clean = subject.replace(/^(re|fwd):\s*/i, "").trim();
      const ref = clean ? `on "${clean}"` : "on my last note";
      if (short) return `Just following up ${ref} — any update?`;
      if (formal)
        return `I wanted to gently follow up ${ref}. Whenever you have a moment, I'd appreciate an update on where things stand.`;
      return `Just circling back ${ref} — any movement on this when you get a sec? No rush at all, just keeping it on my radar.`;
    }
    case "remind": {
      const m = intent.match(
        /^(?:just a |a )?remind(?:er)?(?:\s+(?:me|them|him|her|you))?\s*(to|that|about)?\s*(.*)/i,
      );
      const conn = (m?.[1] || "").toLowerCase();
      const rest = squish(m?.[2] || "");
      const clause = rest
        ? conn === "to"
          ? `to ${lowerFirst(rest)}`
          : conn === "about"
            ? `about ${lowerFirst(rest)}`
            : `that ${lowerFirst(rest)}`
        : "";
      if (short) return squish(`Quick reminder ${clause}`.trim()) + ".";
      if (formal)
        return squish(`Just a brief reminder ${clause}. Please let me know if anything is needed from my side.`);
      return squish(`Just a quick reminder ${clause}! Let me know if you need anything from me.`);
    }
    case "apology": {
      if (short) return `Sorry about that — I'll make it right.`;
      if (formal)
        return `Please accept my apologies for this. I take full responsibility and will make sure it's put right.`;
      return `I'm really sorry about that! Totally my mistake — I'll get it sorted right away.`;
    }
    case "thanks": {
      if (short) return `Thanks so much for this — really appreciate it!`;
      if (formal) return `Thank you very much for this; I genuinely appreciate your time and help.`;
      return `Thanks a ton for this — really appreciate you sorting it out!`;
    }
    case "request": {
      const c =
        lowerFirst(
          squish(
            intent.replace(
              /^(?:please|could you|can you|would you(?:\s+mind)?|i need(?: you)? to|we need(?: you)? to|requesting)\s*/i,
              "",
            ),
          ),
        ) || "help with this";
      if (short) return `Could you ${c}?`;
      if (formal) return `When you have a moment, could you please ${c}? I'd be grateful for your help.`;
      return `Could you ${c} when you get a chance? Really appreciate it!`;
    }
    case "inform": {
      const c =
        lowerFirst(
          squish(
            intent.replace(
              /^(?:just (?:a )?(?:heads up|letting you know)[,:]?|fyi[,:]?|wanted to let you know(?: that)?|let .*? know(?: that)?|tell .*? (?:that|about)|note that|update[: ])\s*/i,
              "",
            ),
          ),
        ) || "there's an update on this";
      if (short) return `Heads up — ${c}.`;
      if (formal) return `I wanted to let you know that ${c}. Please let me know if you have any questions.`;
      return `Just a heads up — ${c}. Shout if you have any questions!`;
    }
    case "open": {
      if (short) return pick([`Hope you're well — just checking in!`, `Quick hello — how are things?`]);
      if (formal)
        return pick([
          `I hope this message finds you well. I wanted to reach out and check in on how things are progressing.`,
          `I hope you are doing well. I'm writing simply to touch base and see whether there's anything you need from me.`,
        ]);
      return pick([
        `Hope you're doing well! Just wanted to reach out and see how things are going.`,
        `Hope all's well on your end — just dropping a quick note to check in.`,
      ]);
    }
    case "general":
    default: {
      const stmt = asSentence(firstPerson(intent));
      if (short) return stmt;
      if (formal)
        return `${stmt} ${pick([
          "Please let me know your thoughts.",
          "I'd appreciate your input whenever convenient.",
          "Do let me know if you have any questions.",
        ])}`;
      return `${stmt} ${pick([
        "Let me know what you think!",
        "Happy to chat more whenever.",
        "Let me know if that works for you.",
      ])}`;
    }
  }
}

// ---- context-aware reply (no intent typed) --------------------------------
// When the user hits "Draft reply" without saying what to write, base the draft
// on the message being replied to: strip the quoted history / footer, work out
// what kind of email it is, and answer it appropriately — so every email gets a
// different, on-topic reply instead of one generic note.
function cleanIncoming(raw: string): string {
  let s = raw.replace(/<[^>]+>/g, " ");
  // Drop everything from the first quoted-history marker onward.
  const cut = s.search(/\n\s*(?:On .+wrote:|-{3,}\s*Original Message|From:\s.+\bSent:|>{1,}\s)/i);
  if (cut > 40) s = s.slice(0, cut);
  s = s.replace(/https?:\/\/\S+/gi, " ");
  // Trim common marketing / legal footers.
  s = s.replace(
    /\b(unsubscribe|view (?:this|it)? ?in (?:your )?browser|you(?:'re| are)? receiving this|manage (?:your )?preferences|©\s?\d{4}|all rights reserved|sent from my \w+)\b[\s\S]*$/i,
    " ",
  );
  return squish(s);
}

type Incoming = "meeting" | "request" | "question" | "announcement" | "receipt" | "thanks" | "general";

function classifyIncoming(subject: string, body: string): Incoming {
  const t = `${subject}\n${body}`.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  const asks = /\?/.test(body) || /\?/.test(subject);
  if (has(/\b(meeting|invit(?:e|ation)|calendar invite|let'?s (?:meet|catch up|sync)|are you (?:free|available)|schedule (?:a )?(?:call|meeting|time)|set up (?:a )?(?:call|meeting)|jump on a call|book a (?:time|slot)|zoom|google meet|teams meeting)\b/))
    return "meeting";
  // An info-seeking question wants an *answer* from me — keep it distinct from
  // an action request ("review the deck") even when it's phrased as "could you".
  if (
    asks &&
    has(/\b(do you|are you|could you (?:confirm|clarify|let me know|tell|share|advise)|can you (?:confirm|clarify|let me know|tell)|would you know|what(?:'s| is| are| was)?|when|where|how (?:much|many|do|does|long|should)|which|any idea|wondering|let me know (?:if|what|when|whether|your))\b/))
    return "question";
  if (has(/\b(action required|please (?:review|sign|confirm|complete|approve|fill|submit|send|provide|update)|could you (?:please )?|can you (?:please )?|we need you to|kindly (?:review|confirm|send|complete)|requires your|awaiting your)\b/))
    return "request";
  if (has(/\b(thank you for|thanks for (?:your|the|reaching|getting)|we (?:really )?appreciate)\b/)) return "thanks";
  if (has(/\b(order (?:#|confirm|number)|receipt|invoice|payment (?:received|confirmation|of)|has shipped|out for delivery|your (?:subscription|booking|reservation)|confirmation (?:number|#|code))\b/))
    return "receipt";
  if (has(/\b(we'?ve (?:updated|launched|added|changed|released)|we are writing to (?:let you know|inform)|we'?re (?:excited|thrilled|pleased) to|introducing|new (?:feature|update|version|release)|release notes|changelog|what'?s new|terms (?:of service|& conditions|and conditions)|privacy policy|scheduled maintenance|product update|newsletter|weekly digest|do not reply|no-?reply)\b/))
    return "announcement";
  if (/\?/.test(body) || /\?/.test(subject)) return "question";
  return "general";
}

function replyFromMessage(prevBody: string, prevSubject: string, tone: Tone): string {
  const subj = prevSubject.replace(/^(re|fwd|fw):\s*/i, "").trim();
  const kind = classifyIncoming(subj, cleanIncoming(prevBody));
  const ref = subj && subj.length <= 70 ? ` about "${subj}"` : "";
  const short = tone === "short";
  const formal = tone === "formal";

  switch (kind) {
    case "meeting":
      if (short) return `Thanks for the invite — that works for me. I'll confirm shortly.`;
      if (formal)
        return `Thank you for the invitation${ref}. That should work on my end — I'll confirm the details shortly.`;
      return pick([
        `Thanks for the invite${ref}! That works for me — I'll get it on my calendar and confirm shortly.`,
        `Appreciate the invite${ref}. Looks good on my end — let me check my calendar and lock it in.`,
      ]);
    case "request":
      if (short) return `Got it — I'll take care of this and follow up.`;
      if (formal)
        return `Thank you for the note${ref}. I'll take care of it and follow up with you shortly.`;
      return pick([
        `Thanks for the note${ref} — I'll get this sorted and follow up shortly.`,
        `Thanks for sending this over${ref} — on it, and I'll circle back soon.`,
      ]);
    case "question":
      if (short) return `Good question — let me look into it and get back to you.`;
      if (formal)
        return `Thank you for reaching out${ref}. Let me look into this and come back to you shortly with an answer.`;
      return pick([
        `Thanks for reaching out${ref}! Let me dig into this and get back to you shortly.`,
        `Great question${ref} — let me check on a couple of things and revert soon.`,
      ]);
    case "announcement":
      if (short) return `Thanks for the heads up — I'll take a look.`;
      if (formal)
        return `Thank you for the update${ref}. I appreciate you keeping me informed and will review it when I have a moment.`;
      return pick([
        `Thanks for the heads up${ref} — appreciate you keeping me in the loop. I'll take a look when I get a chance.`,
        `Good to know${ref} — thanks for the update! I'll give it a read shortly.`,
      ]);
    case "receipt":
      if (short) return `Thanks — got it, all received.`;
      if (formal)
        return `Thank you for the confirmation${ref}. I've received it and will keep it on file.`;
      return `Thanks for this${ref} — got it, all received on my end!`;
    case "thanks":
      if (short) return `You're welcome — happy to help!`;
      if (formal)
        return `You're very welcome — I was glad to help. Please don't hesitate to reach out if anything else comes up.`;
      return `You're very welcome — happy to help! Just shout if there's anything else.`;
    case "general":
    default:
      if (short) return `Thanks for your note — I'll review and get back to you.`;
      if (formal)
        return `Thank you for your message${ref}. I'll review it and come back to you shortly.`;
      return pick([
        `Thanks for your message${ref}! I'll take a look and get back to you shortly.`,
        `Appreciate you reaching out${ref} — I'll review and follow up soon.`,
      ]);
  }
}

// ---- assembly --------------------------------------------------------------
function greeting(name: string | null, tone: Tone): string {
  if (tone === "formal") return name ? `Dear ${name},` : "Hello,";
  return name ? `Hi ${name},` : "Hi there,";
}

function signoff(tone: Tone): string {
  if (tone === "formal") return pick(["Best regards,", "Kind regards,", "Sincerely,"]);
  return pick(["Thanks,", "Cheers,", "Best,", "Thanks so much,"]);
}

function build(input: DraftInput): string {
  const tone = input.tone;
  const act = detectAct(input.intent);
  // No explicit instruction + a real message to reply to → ground the reply in
  // that message instead of emitting the generic "just checking in" note.
  const useMessageReply = act === "open" && input.previousBody.trim().length > 0;
  const when = buildWhen(input.intent);
  const body = squish(
    useMessageReply
      ? replyFromMessage(input.previousBody, input.previousSubject, tone)
      : bodyFor(act, tone, when, input.intent, input.previousSubject),
  );
  // "Short" is meant to be terse — one clean line, no greeting or sign-off.
  if (tone === "short") return body;
  const name = recipientName(input.previousFrom);
  return `${greeting(name, tone)}\n\n${body}\n\n${signoff(tone)}`;
}

export async function generateDraft(input: DraftInput): Promise<DraftOutput> {
  const parsed = DraftInputSchema.parse(input);
  return { body: build(parsed), tone: parsed.tone };
}
