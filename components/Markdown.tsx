"use client";

import {
  Children,
  isValidElement,
  memo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { copyText } from "@/lib/copy";
import { CheckIcon, CopyIcon } from "./icons";

function Pre({ children }: { children?: ReactNode }) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const child = Children.toArray(children)[0];
  const className = isValidElement<{ className?: string }>(child) ? (child.props.className ?? "") : "";
  const lang = /language-([\w-]+)/.exec(className)?.[1] ?? "code";

  const copy = async () => {
    const text = (codeRef.current?.textContent ?? "").replace(/\n$/, "");
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="codeblock">
      <div className="code-head">
        <span>{lang}</span>
        <button type="button" className="code-copy" onClick={copy}>
          {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={codeRef}>{children}</pre>
    </div>
  );
}

function Table({ children }: { children?: ReactNode }) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  );
}

function Link({ href, children }: ComponentPropsWithoutRef<"a">) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{ pre: Pre, table: Table, a: Link }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default Markdown;
