import { Type, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolsSidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">AI Tools</h2>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <Button variant="ghost" className="justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800">
          <Type className="w-4 h-4" />
          Auto Subtitles
        </Button>
        <Button variant="ghost" className="justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800">
          <Scissors className="w-4 h-4" />
          Remove Silence
        </Button>
      </div>
    </aside>
  );
}
