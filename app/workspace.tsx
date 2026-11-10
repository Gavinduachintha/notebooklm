"use client";

import { ArrowUp, Menu, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  blocks?: Block[];
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

const starter: Conversation[] = [
  {
    id: "eucalyptus",
    title: "Leaf oils, field notes",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "Summarize the field notes on eucalyptus leaf oils. Keep the tone editorial, and flag what still needs a source.",
      },
      {
        id: "m2",
        role: "assistant",
        blocks: [
          {
            type: "p",
            text: "The notes describe a cool, camphoraceous oil concentrated in young leaves. The scent is strongest at midday, after the cut surface has aired for a few minutes.",
          },
          {
            type: "list",
            items: [
              "Young leaves read sharper than mature ones.",
              "Shade samples were milder and slightly sweet.",
              "Yield is mentioned once, without a method. That line still needs a source.",
            ],
          },
          {
            type: "p",
            text: "I would keep the midday observation in the body of the note and move the unsourced yield into a margin question.",
          },
        ],
      },
    ],
  },
  {
    id: "quotes",
    title: "Pulling quotations",
    messages: [
      {
        id: "m3",
        role: "user",
        text: "Show a small extractor I can adapt for quotations in the reading list.",
      },
      {
        id: "m4",
        role: "assistant",
        blocks: [
          {
            type: "p",
            text: "This keeps the quotation and the page together. Swap the pattern if a source uses a different mark.",
          },
          {
            type: "code",
            language: "python",
            code: 'import re\n\ndef quotations(page: str) -> list[str]:\n    return re.findall(r"“([^”]+)”", page)',
          },
        ],
      },
    ],
  },
];

function titleFromDraft(draft: string) {
  const line = draft.trim().split("\n")[0] ?? "New conversation";
  return line.length > 42 ? `${line.slice(0, 42).trimEnd()}…` : line;
}

export function Workspace() {
  const [conversations, setConversations] = useState(starter);
  const [activeId, setActiveId] = useState(starter[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const active =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [active.messages.length, pendingId, activeId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function openConversation(id: string) {
    setActiveId(id);
    if (window.innerWidth < 640) setSidebarOpen(false);
  }

  function startConversation() {
    const id = crypto.randomUUID();
    setConversations((current) => [
      { id, title: "New conversation", messages: [] },
      ...current,
    ]);
    setActiveId(id);
    setDraft("");
    if (window.innerWidth < 640) setSidebarOpen(false);
  }

  function send() {
    const text = draft.trim();
    const conversationId = active.id;
    if (!text || pendingId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const untitled = conversation.messages.length === 0;
        return {
          ...conversation,
          title: untitled ? titleFromDraft(text) : conversation.title,
          messages: [...conversation.messages, userMessage],
        };
      }),
    );
    setDraft("");
    setPendingId(conversationId);

    timerRef.current = window.setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        blocks: [
          {
            type: "p",
            text: "Noted. I kept this on the page so you can keep reading. When a source is attached, I can tie the point back to it.",
          },
        ],
      };
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, messages: [...conversation.messages, reply] }
            : conversation,
        ),
      );
      setPendingId(null);
    }, 700);
  }

  const canSend = draft.trim().length > 0 && !pendingId;

  return (
    <div className="flex h-dvh min-h-0 bg-canvas text-ink">
      <aside
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } w-72 shrink-0 flex-col border-r border-line bg-sidebar max-sm:w-full`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div>
            <p className="font-serif text-xl leading-none text-ink">Notebook</p>
            <p className="mt-1 text-xs tracking-wide text-muted">Research</p>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:hidden"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={startConversation}
            className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus size={16} strokeWidth={1.75} className="text-sage" />
            New conversation
          </button>
        </div>

        <p className="px-4 pb-2 text-[11px] tracking-[0.14em] text-muted uppercase">
          History
        </p>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" aria-label="Conversation history">
          <ul className="space-y-0.5">
            {conversations.map((conversation) => {
              const selected = conversation.id === active.id;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    aria-current={selected ? "page" : undefined}
                    className={`w-full rounded-lg border-l-2 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      selected
                        ? "border-sage bg-surface text-ink"
                        : "border-transparent text-muted hover:bg-surface/70 hover:text-ink"
                    }`}
                  >
                    <span className="block truncate">{conversation.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main
        className={`${
          sidebarOpen ? "hidden sm:flex" : "flex"
        } min-w-0 flex-1 flex-col bg-canvas`}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          <button
            type="button"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <p className="truncate text-sm text-muted">{active.title}</p>
        </header>

        <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8">
            {active.messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-2 pt-24 text-center">
                <p className="text-xs tracking-[0.18em] text-copper uppercase">
                  Research
                </p>
                <h1 className="mt-3 max-w-lg font-serif text-4xl leading-tight text-ink sm:text-5xl">
                  What would you like to study?
                </h1>
                <p className="mt-4 max-w-md text-base leading-7 text-muted">
                  Ask about a source, a passage, or a note. The page stays quiet until you do.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {active.messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl bg-surface px-4 py-3 text-[15px] leading-7 whitespace-pre-wrap text-ink">
                        {message.text}
                      </p>
                    </div>
                  ) : (
                    <article key={message.id} className="note max-w-none text-[15px] leading-7">
                      {message.blocks?.map((block, index) => {
                        if (block.type === "p") {
                          return (
                            <p key={index} className="mt-4 first:mt-0">
                              {block.text}
                            </p>
                          );
                        }
                        if (block.type === "list") {
                          return (
                            <ul key={index} className="mt-4 list-disc space-y-1.5 pl-5 text-ink">
                              {block.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <pre key={index} className="mt-4">
                            <code>{block.code}</code>
                          </pre>
                        );
                      })}
                    </article>
                  ),
                )}
                {pendingId === active.id ? (
                  <div
                    className="flex items-center gap-1.5 py-1"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="sr-only">Writing a reply</span>
                    <span className="size-1.5 rounded-full bg-sage motion-safe:animate-pulse" />
                    <span className="size-1.5 rounded-full bg-sage motion-safe:animate-pulse [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-sage motion-safe:animate-pulse [animation-delay:300ms]" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-4 pb-5">
          <form
            className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-line bg-surface px-3 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <label className="sr-only" htmlFor="prompt">
              Message
            </label>
            <textarea
              id="prompt"
              rows={1}
              value={draft}
              placeholder="Ask about a source or a note"
              disabled={pendingId !== null}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-muted disabled:text-muted"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!canSend}
              className="mb-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-sidebar transition-colors hover:bg-accent/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-elevated disabled:text-muted"
            >
              <ArrowUp size={18} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
