import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Empty State / Example Project */}
          <Link href="/editor/new">
            <div className="border border-slate-800 rounded-xl bg-slate-900/50 p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-slate-800/50 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                <FolderOpen className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
              </div>
              <h3 className="font-medium text-slate-300 group-hover:text-white">Example Project</h3>
              <p className="text-xs text-slate-500 mt-2">Edited 2 days ago</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
