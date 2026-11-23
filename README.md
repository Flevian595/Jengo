# Jengo

A coding chat app built with Next.js. Desktop gets a sidebar, mobile gets a slide-in drawer. Replies stream from any open-source model served over an OpenAI-compatible API.

## Run it

```bash
npm install
cp .env.example .env.local
ollama pull qwen2.5-coder:7b   # or use a hosted provider, see below
npm run dev
```

Open http://localhost:3000.

## Pick a model

Set three variables in `.env.local`:

| Where it runs | `AI_BASE_URL` | `AI_MODEL` example |
| --- | --- | --- |
| Ollama (local) | `http://localhost:11434/v1` | `qwen2.5-coder:7b`, or a larger Qwen coder tag if your GPU allows |
| OpenRouter | `https://openrouter.ai/api/v1` | `qwen/qwen3-coder` (needs `AI_API_KEY`) |
| Groq, Together, Fireworks, vLLM, LM Studio | the provider's `/v1` URL | the provider's model name |

The API key stays on the server. The browser only talks to `/api/chat`.

## Where things live

- `app/api/chat/route.ts`: system prompt, model call, stream conversion
- `components/Chat.tsx`: conversations, streaming, stop and retry
- `app/globals.css`: all styling and the light and dark themes

Chats are saved in the browser's localStorage. Clearing site data removes them.

## Deploying

Deploy to Vercel or any Node host and set the same env vars. `localhost` Ollama is only reachable when the app runs on the same machine, so use a hosted model for a public deployment.
