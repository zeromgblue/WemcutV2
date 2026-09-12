import { Play, SkipBack, SkipForward, Split, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

type Clip = {
  id?: string;
  name?: string;
};

export function TimelinePanel({ clips }: { clips: Clip[] }) {
  return (
    <footer className="h-64 border-t border-slate-800 bg-slate-900 flex flex-col shrink-0">
      <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
            <Split className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
            <Scissors className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-white bg-indigo-600 hover:bg-indigo-700">
            <Play className="w-4 h-4" fill="currentColor" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs font-mono text-slate-500">00:00:00:00</div>
      </div>

      <div className="flex-1 p-4 overflow-x-auto relative">
        {clips.length > 0 ? (
          <>
            <div className="absolute top-0 bottom-0 left-32 w-px bg-red-500 z-10">
              <div className="w-3 h-3 bg-red-500 rotate-45 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-sm" />
            </div>
            <div className="h-16 bg-slate-800/50 rounded-md border border-slate-800 mt-2 flex items-center px-2 gap-1">
              {clips.map((clip, i) => (
                <div
                  key={clip.id ?? i}
                  className="h-10 bg-indigo-600/30 border border-indigo-500/50 rounded flex-1 flex items-center justify-center text-xs text-indigo-200 truncate px-2"
                >
                  {clip.name ?? `Clip ${i + 1}`}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-16 bg-slate-800/30 rounded-md border border-dashed border-slate-800 mt-2 flex items-center justify-center">
            <p className="text-xs text-slate-600">ยังไม่มี Timeline — เริ่มตัดต่อเพื่อสร้าง Clip แรก</p>
          </div>
        )}
      </div>
    </footer>
  );
}
