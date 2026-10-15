/// <reference types="node" />
/**
 * Contact form endpoint (a Vercel Function). The form posts JSON here and the message is emailed to the site owner
 * through Resend's REST API.
 *
 * Environment variables (Vercel project settings):
 *   RESEND_API_KEY      required
 *   CONTACT_TO_EMAIL    required, where messages are delivered
 *   CONTACT_FROM_EMAIL  optional sender, e.g. "Donny Digital <contact@donny-digital.com>" once that domain is verified in
 *                       Resend. Defaults to Resend's shared test sender, which can only deliver to the Resend account owner.
 */

// Keep in sync with TOPICS in src/pages/ContactPage.tsx.
const TOPICS = ["New website", "Redesign", "Design system", "Brand & identity", "Something else"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM = "Donny Digital <onboarding@resend.dev>";

const reply = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Best-effort limit per warm function instance: it stops bursts, not a determined attacker.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 500) for (const [key, times] of recent) if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
  return hits.length > MAX_PER_WINDOW;
}

/** Environment values are often pasted with stray spaces or quotes; remove them. */
const envValue = (name: string) => (process.env[name] ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

/** One-line text: no line breaks, collapsed whitespace. */
const oneLine = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

export async function POST(request: Request) {
  // Same-origin only: the form lives on this site, so a different Origin is somebody else's script.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === host;
    } catch {
      // malformed Origin header
    }
    if (!sameOrigin) return reply({ error: "forbidden" }, 403);
  }

  let data: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error("not an object");
    data = parsed as Record<string, unknown>;
  } catch {
    return reply({ error: "invalid_request" }, 400);
  }

  // Honeypot: the form has a hidden field real visitors never fill in. Pretend it worked so bots do not retry.
  if (typeof data.company === "string" && data.company.trim() !== "") return reply({ ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return reply({ error: "rate_limited" }, 429);

  const name = oneLine(data.name);
  const email = oneLine(data.email);
  const topic = oneLine(data.topic);
  const message = typeof data.message === "string" ? data.message.replace(/\r\n?/g, "\n").trim() : "";

  if (!name || name.length > 100) return reply({ error: "invalid_name" }, 400);
  if (!EMAIL_PATTERN.test(email) || email.length > 200) return reply({ error: "invalid_email" }, 400);
  if (!TOPICS.includes(topic)) return reply({ error: "invalid_topic" }, 400);
  if (!message || message.length > 5000) return reply({ error: "invalid_message" }, 400);

  const apiKey = envValue("RESEND_API_KEY");
  const to = envValue("CONTACT_TO_EMAIL");
  if (!apiKey || !to) {
    console.error("Contact form is not configured: RESEND_API_KEY or CONTACT_TO_EMAIL is missing.");
    return reply({ error: "not_configured" }, 500);
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: envValue("CONTACT_FROM_EMAIL") || DEFAULT_FROM,
        to: [to],
        reply_to: email,
        subject: `New enquiry: ${topic} — ${name}`,
        text: `New message from the donny-digital.com contact form\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}\n`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("Resend rejected the message:", res.status, await res.text());
      return reply({ error: "send_failed" }, 502);
    }
  } catch (err) {
    console.error("Could not reach Resend:", err);
    return reply({ error: "send_failed" }, 502);
  }

  return reply({ ok: true });
}
