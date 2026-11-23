"use client";

import type { Conversation } from "@/lib/types";
import { Logo, PlusIcon, TrashIcon } from "./icons";
import ThemeToggle from "./ThemeToggle";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="sidebar" aria-label="Conversations">
      <div className="brand">
        <Logo />
        jengo
      </div>

      <button type="button" className="new-btn" onClick={onNew}>
        <PlusIcon width={18} height={18} />
        New chat
      </button>

      {sorted.length === 0 ? (
        <p className="empty-list">Your chats will appear here.</p>
      ) : (
        <ul className="conv-list">
          {sorted.map((c) => (
            <li key={c.id} className="conv" data-active={c.id === activeId}>
              <button
                type="button"
                className="conv-open"
                onClick={() => onSelect(c.id)}
                aria-current={c.id === activeId ? "true" : undefined}
              >
                {c.title}
              </button>
              <button
                type="button"
                className="conv-del"
                onClick={() => onDelete(c.id)}
                aria-label={`Delete chat: ${c.title}`}
              >
                <TrashIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="side-foot">
        <ThemeToggle />
      </div>
    </aside>
  );
}
