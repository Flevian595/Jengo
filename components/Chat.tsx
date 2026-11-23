"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, Conversation } from "@/lib/types";
import { uid } from "@/lib/id";
import Sidebar from "./Sidebar";
import MessageView from "./MessageView";
import Composer from "./Composer";
import Welcome from "./Welcome";
import { MenuIcon, PlusIcon } from "./icons";

const STORAGE_KEY = "jengo:v1";

export default function Chat() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [model, setModel] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  // Load saved chats and the configured model name.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Conversation[];
        if (Array.isArray(parsed)) setConvs(parsed);
      }
    } catch {
      // corrupted storage: start fresh
    }
    setReady(true);
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setModel(typeof d.model === "string" ? d.model : ""))
      .catch(() => {});
  }, []);

  // Save (debounced so streaming doesn't hammer storage).
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 50)));
      } catch {
        // storage full or blocked
      }
    }, 400);
    return () => clearTimeout(t);
  }, [convs, ready]);

  const active = convs.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  // Follow the stream unless the reader has scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const patchConv = useCallback(
    (id: string, fn: (c: Conversation) => Conversation) =>
      setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c))),
    [],
  );

  const patchMessage = useCallback(
    (convId: string, msgId: string, fn: (m: ChatMessage) => ChatMessage) =>
      patchConv(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)),
      })),
    [patchConv],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(
    async (convId: string, history: ChatMessage[]) => {
      const reply: ChatMessage = { id: uid(), role: "assistant", content: "" };
      patchConv(convId, (c) => ({ ...c, messages: [...history, reply], updatedAt: Date.now() }));

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);
      stick.current = true;

      try {
        const payload = history
          .filter((m) => m.content.trim().length > 0)
          .map(({ role, content }) => ({ role, content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Request failed (${res.status}).`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) patchMessage(convId, reply.id, (m) => ({ ...m, content: m.content + chunk }));
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        patchMessage(convId, reply.id, (m) => ({ ...m, error: (e as Error).message }));
      } finally {
        if (abortRef.current === ctrl) {
          abortRef.current = null;
          setStreaming(false);
        }
      }
    },
    [patchConv, patchMessage],
  );

  const submit = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || streaming) return;
      const user: ChatMessage = { id: uid(), role: "user", content: t };

      if (active) {
        run(active.id, [...active.messages, user]);
      } else {
        const id = uid();
        const conv: Conversation = {
          id,
          title: t.length > 48 ? `${t.slice(0, 48)}…` : t,
          messages: [user],
          updatedAt: Date.now(),
        };
        setConvs((prev) => [conv, ...prev]);
        setActiveId(id);
        run(id, [user]);
      }
    },
    [active, streaming, run],
  );

  const retry = useCallback(() => {
    if (!active || streaming) return;
    const history = [...active.messages];
    while (history.length && history[history.length - 1].role === "assistant") history.pop();
    if (history.length) run(active.id, history);
  }, [active, streaming, run]);

  const newChat = useCallback(() => {
    stop();
    setActiveId(null);
    setDrawer(false);
    stick.current = true;
  }, [stop]);

  const select = useCallback(
    (id: string) => {
      stop();
      setActiveId(id);
      setDrawer(false);
      stick.current = true;
    },
    [stop],
  );

  const remove = useCallback(
    (id: string) => {
      if (id === activeId) stop();
      setConvs((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) setActiveId(null);
    },
    [activeId, stop],
  );

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  return (
    <div className="app" data-drawer={drawer}>
      <Sidebar
        conversations={convs}
        activeId={activeId}
        onSelect={select}
        onNew={newChat}
        onDelete={remove}
      />
      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <main className="main">
        <header className="top">
          <button
            type="button"
            className="icon-btn menu"
            onClick={() => setDrawer(true)}
            aria-label="Open conversations"
          >
            <MenuIcon />
          </button>
          <h1 className="top-title">{active?.title ?? "New chat"}</h1>
          {model && (
            <span className="model" title="Model in use">
              {model}
            </span>
          )}
          <button type="button" className="icon-btn newchat-mobile" onClick={newChat} aria-label="New chat">
            <PlusIcon />
          </button>
        </header>

        <div className="scroller" ref={scrollRef} onScroll={onScroll}>
          {messages.length === 0 ? (
            <Welcome onPick={submit} />
          ) : (
            <ol className="thread">
              {messages.map((m, i) => (
                <MessageView
                  key={m.id}
                  message={m}
                  isLast={i === messages.length - 1}
                  live={streaming && i === messages.length - 1}
                  onRetry={retry}
                />
              ))}
            </ol>
          )}
        </div>

        <Composer streaming={streaming} focusKey={activeId ?? "new"} onSend={submit} onStop={stop} />
      </main>
    </div>
  );
}
