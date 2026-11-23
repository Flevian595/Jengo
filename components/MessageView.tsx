"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { copyText } from "@/lib/copy";
import Markdown from "./Markdown";
import { CheckIcon, CopyIcon, RefreshIcon } from "./icons";

interface Props {
  message: ChatMessage;
  isLast: boolean;
  live: boolean;
  onRetry: () => void;
}

export default function MessageView({ message, isLast, live, onRetry }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await copyText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <li className={`turn ${isUser ? "turn-user" : "turn-ai"}${live ? " live" : ""}`}>
      <span className="node" aria-hidden="true" />
      <div className="turn-body">
        <div className="who">{isUser ? "You" : "Jengo"}</div>

        {isUser ? (
          <p className="user-text">{message.content}</p>
        ) : message.content ? (
          <Markdown content={message.content} />
        ) : message.error ? null : (
          <span className="thinking" role="status" aria-label="Jengo is writing">
            <i />
            <i />
            <i />
          </span>
        )}

        {message.error && (
          <div className="err" role="alert">
            <strong>No reply.</strong> {message.error}{" "}
            {isLast && (
              <button type="button" onClick={onRetry}>
                Try again
              </button>
            )}
          </div>
        )}

        {!isUser && !live && message.content && (
          <div className="actions">
            <button type="button" className="act" onClick={copy}>
              {copied ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
            {isLast && (
              <button type="button" className="act" onClick={onRetry}>
                <RefreshIcon width={15} height={15} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
