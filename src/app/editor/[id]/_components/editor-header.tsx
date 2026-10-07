"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Pencil, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EditorHeader({
  projectName,
  dirty,
  saving,
  onSave,
  onRename,
  onExport,
  exporting,
  exportProgress,
  exportError,
  canExport,
}: {
  projectName: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onRename: (name: string) => Promise<void>;
  onExport: () => void;
  exporting: boolean;
  exportProgress: number;
  exportError: string | null;
  canExport: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(projectName);
  const [renameError, setRenameError] = useState<string | null>(null);

  function startEditing() {
    setDraft(projectName);
    setRenameError(null);
    setEditing(true);
  }

  async function commitRename() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === projectName) {
      setEditing(false);
      return;
    }
    try {
      await onRename(trimmed);
      setEditing(false);
    } catch {
      setRenameError("เปลี่ยนชื่อไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  }

  return (
    <header className="h-14 border-b border-border bg-sidebar flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          onClick={(e) => {
            if (dirty && !confirm("มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการออกจากหน้านี้ใช่ไหม?")) {
              e.preventDefault();
            }
          }}
          className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-md flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-700 shrink-0">
            <Scissors className="w-3 h-3 text-white" />
          </div>
          {editing ? (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
              autoFocus
              className="h-7 text-sm max-w-48"
            />
          ) : (
            <>
              <span className="font-medium text-sm text-foreground truncate">
                {projectName}
              </span>
              <button
                onClick={startEditing}
                className="text-muted-foreground hover:text-foreground shrink-0"
                title="แก้ไขชื่อโปรเจกต์"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {dirty && !saving && (
            <span className="size-1.5 rounded-full bg-brand-400 shrink-0" title="มีการเปลี่ยนแปลงที่ยังไม่บันทึก" />
          )}
          {renameError && <span className="text-xs text-destructive shrink-0">{renameError}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {exportError && <span className="text-xs text-destructive max-w-48 truncate" title={exportError}>{exportError}</span>}
        {exporting && (
          <span className="text-xs text-muted-foreground tabular-nums">
            กำลังส่งออก... {Math.round(exportProgress * 100)}%
          </span>
        )}
        <Button variant="outline" onClick={onSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Button
          className="bg-brand-500 text-white hover:bg-brand-400 gap-1.5"
          onClick={onExport}
          disabled={exporting || !canExport}
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exporting ? "กำลังส่งออก" : "ส่งออก"}
        </Button>
      </div>
    </header>
  );
}
