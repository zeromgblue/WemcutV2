import { Play, SkipBack, SkipForward, Split, Scissors, Type, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditorPage() {
  return (
    <div className="h-screen w-full bg-slate-950 text-slate-50 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg text-white">WemCut <span className="text-slate-500 text-sm font-normal">/ Untitled Project</span></h1>
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

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Tools/Assets) */}
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

        {/* Center Canvas (Video Player) */}
        <section className="flex-1 flex flex-col bg-black items-center justify-center relative p-8">
          <div className="aspect-video w-full max-w-4xl bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
            <p className="text-slate-600">Video Preview Area</p>
          </div>
        </section>

        {/* Right Sidebar (AI Chat/Prompt) */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">AI Director</h2>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
              Hello! I'm your AI Director. Tell me what you want to do with your video.
            </div>
          </div>
          <div className="p-4 border-t border-slate-800">
            <input 
              type="text" 
              placeholder="e.g. 'Cut out the silent parts...'"
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </aside>
      </main>

      {/* Bottom Timeline */}
      <footer className="h-64 border-t border-slate-800 bg-slate-900 flex flex-col shrink-0">
        {/* Timeline Toolbar */}
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
          <div className="text-xs font-mono text-slate-500">
            00:00:00:00
          </div>
        </div>
        {/* Timeline Tracks */}
        <div className="flex-1 p-4 overflow-x-auto relative">
          <div className="absolute top-0 bottom-0 left-32 w-px bg-red-500 z-10">
            <div className="w-3 h-3 bg-red-500 rotate-45 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-sm" />
          </div>
          <div className="h-16 bg-slate-800/50 rounded-md border border-slate-800 mt-2 flex items-center px-4">
            <div className="h-10 bg-indigo-600/30 border border-indigo-500/50 rounded flex-1"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
