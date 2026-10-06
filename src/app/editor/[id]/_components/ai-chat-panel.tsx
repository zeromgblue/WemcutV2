"use client";

import { useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { interpretCommand } from "@/app/actions/ai-director";

type ChatMessage = { role: "user" | "assistant"; text: string };

const GREETING = "สวัสดีครับ ผมคือ AI Director บอกผมได้เลยว่าอยากให้ตัดต่อวิดีโอนี้ยังไง";

export function AIChatPanel({
  projectId,
  clipCount,
  totalDuration,
  playhead,
  onRemoveSilence,
  onSplitAtPlayhead,
  onSeek,
}: {
  projectId: string;
  clipCount: number;
  totalDuration: number;
  playhead: number;
  onRemoveSilence: () => void;
  onSplitAtPlayhead: () => void;
  onSeek: (seconds: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);

    try {
      const result = await interpretCommand(projectId, history, text, {
        clipCount,
        totalDuration,
        playhead,
      });

      if (result.type === "action") {
        if (result.tool === "remove_silence") onRemoveSilence();
        else if (result.tool === "split_at_playhead") onSplitAtPlayhead();
        else if (result.tool === "seek") onSeek(result.input.seconds);
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.message }]);
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
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          ผู้กำกับ AI
        </h2>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "assistant"
                ? "bg-muted rounded-lg rounded-tl-sm px-3 py-2 text-sm text-foreground/90 max-w-[90%]"
                : "bg-amber-500/15 rounded-lg rounded-tr-sm px-3 py-2 text-sm text-foreground/90 max-w-[90%] self-end"
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
            className="bg-amber-500 text-black hover:bg-amber-400 shrink-0"
            disabled={sending || !input.trim()}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </aside>
  );
}
