"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage, fetchChatSummary, type ChatResponse, type ChatSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  recordsUsed?: number;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  "Who owns survey number 142/3?",
  "List all land records in the database",
  "What is the total land area recorded?",
  "Show all owners in the system",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (open && messages.length === 0) {
      fetchChatSummary()
        .then((s) => {
          setSummary(s);
          setMessages([
            {
              id: "welcome",
              role: "system",
              text:
                `Welcome to TerraLens Assistant. I can answer questions about ` +
                `the ${s.total_records} land record(s) stored in the system` +
                (s.districts.length
                  ? ` across ${s.districts.join(", ")}`
                  : "") +
                `. Ask me about land ownership, survey details, patta numbers, ` +
                `property areas, or any other land-record topic.`,
              timestamp: new Date(),
            },
          ]);
        })
        .catch(() => {
          setMessages([
            {
              id: "welcome",
              role: "system",
              text: "Welcome to TerraLens Assistant. Ask me anything about the land records in the system.",
              timestamp: new Date(),
            },
          ]);
        });
    }
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text: q,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const resp: ChatResponse = await sendChatMessage(q);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: resp.answer,
            recordsUsed: resp.records_used,
            timestamp: new Date(),
          },
        ]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            text: `Error: ${err.message || "Could not reach the server."}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  if (!session) return null;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all " +
          (open
            ? "bg-tl-muted/20 text-tl-text hover:bg-tl-muted/30"
            : "bg-tl-gold text-tl-bg hover:bg-tl-gold/90")
        }
        aria-label={open ? "Close chat" : "Open TerraLens Assistant"}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[400px] flex-col overflow-hidden rounded-lg border border-tl-border bg-tl-bg shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-tl-border bg-tl-panel px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tl-gold/20 text-tl-gold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-tl-text">TerraLens Assistant</h3>
              <p className="text-[10px] text-tl-muted">Land Records RAG Chatbot</p>
            </div>
            {summary && (
              <span className="rounded-sm bg-tl-gold/10 px-2 py-0.5 text-[10px] font-medium text-tl-gold">
                {summary.total_records} records
              </span>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  "flex " +
                  (msg.role === "user" ? "justify-end" : "justify-start")
                }
              >
                <div
                  className={
                    "max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed " +
                    (msg.role === "user"
                      ? "bg-tl-gold text-tl-bg"
                      : msg.role === "system"
                        ? "border border-tl-border bg-tl-panel text-tl-muted"
                        : "border border-tl-border bg-tl-panel text-tl-text")
                  }
                >
                  <MessageContent text={msg.text} />
                  {msg.role === "assistant" && msg.recordsUsed !== undefined && msg.recordsUsed > 0 && (
                    <p className="mt-1.5 text-[10px] text-tl-muted">
                      Based on {msg.recordsUsed} record{msg.recordsUsed > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-tl-border bg-tl-panel px-3 py-2">
                  <div className="flex gap-1">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-tl-muted [animation-delay:0ms]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-tl-muted [animation-delay:150ms]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-tl-muted [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions — shown when few messages */}
          {messages.length <= 1 && !loading && (
            <div className="flex flex-wrap gap-1.5 border-t border-tl-border px-4 py-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-sm border border-tl-border bg-tl-bg px-2 py-1 text-[11px] text-tl-muted transition-colors hover:border-tl-gold/50 hover:text-tl-gold"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-tl-border px-4 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about land records..."
              disabled={loading}
              className="min-w-0 flex-1 rounded-md border border-tl-border bg-tl-bg px-3 py-2 text-[13px] text-tl-text placeholder:text-tl-muted focus:border-tl-gold focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-tl-gold text-tl-bg transition-opacity hover:opacity-90 disabled:opacity-30"
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4z" /><path d="m22 2-10 10" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const boldParsed = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        const bulletMatch = line.match(/^(\s*[-*]\s+)(.*)/);
        if (bulletMatch) {
          return (
            <p key={i} className="ml-3">
              <span className="text-tl-gold">&#8226;</span>{" "}
              <span dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^\s*[-*]\s+/, "") }} />
            </p>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: boldParsed }} />;
      })}
    </div>
  );
}
