"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SendIcon, StopIcon } from "./icons";

interface Props {
  streaming: boolean;
  focusKey: string;
  onSend: (text: string) => void;
  onStop: () => void;
}

export default function Composer({ streaming, focusKey, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) ref.current?.focus();
  }, [focusKey]);

  const send = () => {
    if (!value.trim() || streaming) return;
    onSend(value);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    // On phones Enter should add a new line; the send button is right there.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    send();
  };

  return (
    <div className="composer">
      <div className="composer-inner">
        <textarea
          ref={ref}
          value={value}
          rows={1}
          placeholder="Ask Jengo to write, debug or review code"
          aria-label="Message"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {streaming ? (
          <button type="button" className="send stop" onClick={onStop} aria-label="Stop generating">
            <StopIcon />
          </button>
        ) : (
          <button
            type="button"
            className="send"
            onClick={send}
            disabled={!value.trim()}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        )}
      </div>
      <p className="fineprint">Jengo can make mistakes. Read the code before you ship it.</p>
    </div>
  );
}
