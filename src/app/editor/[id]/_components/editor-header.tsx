"use client";

import Link from "next/link";
import { ArrowLeft, Download, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorHeader({
  projectName,
  dirty,
  saving,
  onSave,
}: {
  projectName: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <header className="h-14 border-b border-border bg-sidebar flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-md flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-700 shrink-0">
            <Scissors className="w-3 h-3 text-black" />
          </div>
          <span className="font-medium text-sm text-foreground truncate">
            {projectName}
          </span>
          {dirty && !saving && (
            <span className="size-1.5 rounded-full bg-amber-400 shrink-0" title="มีการเปลี่ยนแปลงที่ยังไม่บันทึก" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" onClick={onSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Button className="bg-amber-500 text-black hover:bg-amber-400 gap-1.5">
          <Download className="w-4 h-4" />
          ส่งออก
        </Button>
      </div>
    </header>
  );
}
