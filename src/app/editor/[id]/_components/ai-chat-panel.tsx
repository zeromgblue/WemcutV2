"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { interpretCommand } from "@/app/actions/ai-director";
import type { DirectorAction, DirectorContext } from "@/lib/director";

type ChatMessage = { role: "user" | "assistant"; text: string };

const GREETING = "สวัสดีครับ ผมคือ AI Director บอกผมได้เลยว่าอยากให้ตัดต่อวิดีโอนี้ยังไง";

const SUGGESTIONS = ["ตัดช่วงเงียบออกให้หมด", "ใส่ซับไตเติลให้หน่อย", "ทำซับเป็นสีเหลืองขอบดำ เด้งๆ", "ซูมวิดีโอให้เต็มกรอบ"];

// Pause between actions so each one runs against the editor state the previous one produced.
const ACTION_SETTLE_MS = 80;

function TypingDots() {
  return (
    <div
      role="status"
      aria-label="AI กำลังตอบ"
      className="bg-muted rounded-lg rounded-tl-sm px-3 py-3 w-fit flex items-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-brand-400"
          style={{ animation: "chat-dot 1.1s ease-in-out infinite", animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function AIChatPanel({
  projectId,
  context,
  onAction,
}: {
  projectId: string;
  context: DirectorContext;
  /** Runs one editor action; resolves when it has finished. */
  onAction: (action: DirectorAction) => void | Promise<void>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text || sending) return;

    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);

    try {
      const result = await interpretCommand(projectId, history, text, context);
      setMessages((prev) => [...prev, { role: "assistant", text: result.message }]);

      for (const action of result.actions) {
        await onAction(action);
        await new Promise((resolve) => setTimeout(resolve, ACTION_SETTLE_MS));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "ขออภัยครับ เกิดข้อผิดพลาด ลองใหม่อีกครั้ง" },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="w-80 border-l border-border bg-sidebar flex flex-col shrink-0">
      <div className="h-10 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          ผู้กำกับ AI
        </h2>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "assistant"
                ? "bg-muted rounded-lg rounded-tl-sm px-3 py-2 text-sm text-foreground/90 max-w-[90%] whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-1 duration-200"
                : "bg-brand-500/15 rounded-lg rounded-tr-sm px-3 py-2 text-sm text-foreground/90 max-w-[90%] self-end whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-1 duration-200"
            }
          >
            {m.text}
          </div>
        ))}

        {sending && <TypingDots />}

        {messages.length === 1 && !sending && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-500/60 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input.trim());
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="เช่น 'ตัดช่วงที่เงียบออกให้หมด'"
            className="bg-background"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-brand-500 text-white hover:bg-brand-400 shrink-0"
            disabled={sending || !input.trim()}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </aside>
  );
}
