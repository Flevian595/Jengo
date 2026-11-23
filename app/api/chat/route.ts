export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = (process.env.AI_BASE_URL ?? "http://localhost:11434/v1").replace(/\/$/, "");
const MODEL = process.env.AI_MODEL ?? "qwen2.5-coder:7b";
const API_KEY = process.env.AI_API_KEY;
const MAX_MESSAGES = 30;

const SYSTEM_PROMPT = `You are Jengo, a senior software engineer pairing with the user.
- Answer the question first, then explain only what is needed.
- Write complete, working code in fenced blocks with the language tag. Prefer TypeScript for JavaScript work unless told otherwise.
- When fixing a bug, name the cause before showing the fix.
- If a request is ambiguous in a way that changes the code, ask one short question. Otherwise state your assumption and continue.
- Keep security in mind: validate input, never hard-code secrets, mention risks that matter.`;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

function isValid(messages: unknown): messages is IncomingMessage[] {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
  );
}

export async function GET() {
  return Response.json({ model: MODEL });
}

export async function POST(req: Request) {
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  if (!isValid(body.messages)) {
    return Response.json({ error: "Send a non-empty messages array." }, { status: 400 });
  }

  const history = body.messages.slice(-MAX_MESSAGES);

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.2,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      }),
      signal: req.signal,
    });
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    return Response.json(
      {
        error: `Can't reach the model server at ${BASE_URL}. Start Ollama (or check AI_BASE_URL in .env.local), then try again.`,
      },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `The model server answered ${upstream.status}. ${detail.slice(0, 300)}`.trim() },
      { status: 502 },
    );
  }

  // Convert the upstream SSE stream into plain text chunks for the browser.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore partial or non-JSON keep-alive lines
            }
          }
        }
      } catch {
        // client aborted or upstream dropped
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
