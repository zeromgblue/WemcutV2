export function AIChatPanel() {
  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">AI Director</h2>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300">
          Hello! I&apos;m your AI Director. Tell me what you want to do with your video.
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
  );
}
