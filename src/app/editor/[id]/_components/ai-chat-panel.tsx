import { Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AIChatPanel() {
  return (
    <aside className="w-80 border-l border-border bg-sidebar flex flex-col shrink-0">
      <div className="h-10 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          ผู้กำกับ AI
        </h2>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="bg-muted rounded-lg rounded-tl-sm px-3 py-2 text-sm text-foreground/90 max-w-[90%]">
          สวัสดีครับ ผมคือ AI Director บอกผมได้เลยว่าอยากให้ตัดต่อวิดีโอนี้ยังไง
        </div>
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <form className="flex items-center gap-2">
          <Input
            placeholder="เช่น 'ตัดช่วงที่เงียบออกให้หมด'"
            className="bg-background"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-amber-500 text-black hover:bg-amber-400 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
