import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorHeader({ projectName }: { projectName: string }) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-lg text-white">
          WemCut <span className="text-slate-500 text-sm font-normal">/ {projectName}</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700">
          Save
        </Button>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
