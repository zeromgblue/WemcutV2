"use client";

import { useRef } from "react";
import { Type, Scissors, Wand2, Loader2, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubtitleStylePanel } from "./subtitle-style-panel";
import type { SubtitleStyle } from "@/lib/subtitle-style";

export function ToolsSidebar({
  onRemoveSilence,
  removingSilence,
  silenceError,
  onGenerateSubtitles,
  generatingSubtitles,
  subtitleError,
  hasSubtitles,
  subtitleStyle,
  onSubtitleStyleChange,
  onAddVideo,
  uploadingVideo,
  uploadError,
  disabled,
}: {
  onRemoveSilence: () => void;
  removingSilence: boolean;
  silenceError: string | null;
  onGenerateSubtitles: () => void;
  generatingSubtitles: boolean;
  subtitleError: string | null;
  hasSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  onSubtitleStyleChange: (next: SubtitleStyle) => void;
  onAddVideo: (file: File) => void;
  uploadingVideo: boolean;
  uploadError: string | null;
  disabled: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
      <div className="h-10 flex items-center px-4 border-b border-border shrink-0">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          เครื่องมือ AI
        </h2>
      </div>
      <div className="p-2 flex flex-col gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onAddVideo(file);
          }}
        />
        <Button
          variant="ghost"
          className="justify-start gap-3 h-9 px-3 font-normal text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingVideo}
        >
          {uploadingVideo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FilePlus2 className="w-4 h-4" />
          )}
          {uploadingVideo ? "กำลังอัปโหลด..." : "เพิ่มวิดีโอ"}
        </Button>
        <Button
          variant="ghost"
          className="justify-start gap-3 h-9 px-3 font-normal text-muted-foreground hover:text-foreground"
          onClick={onGenerateSubtitles}
          disabled={disabled || generatingSubtitles}
        >
          {generatingSubtitles ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Type className="w-4 h-4" />
          )}
          {generatingSubtitles ? "กำลังถอดเสียง..." : "ใส่ซับไตเติลอัตโนมัติ"}
        </Button>
        <SubtitleStylePanel style={subtitleStyle} onChange={onSubtitleStyleChange} disabled={!hasSubtitles} />
        <Button
          variant="ghost"
          className="justify-start gap-3 h-9 px-3 font-normal text-muted-foreground hover:text-foreground"
          onClick={onRemoveSilence}
          disabled={disabled || removingSilence}
        >
          {removingSilence ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Scissors className="w-4 h-4" />
          )}
          {removingSilence ? "กำลังวิเคราะห์เสียง..." : "ลบช่วงเงียบ"}
        </Button>
        <Button
          variant="ghost"
          className="justify-start gap-3 h-9 px-3 font-normal text-muted-foreground hover:text-foreground"
        >
          <Wand2 className="w-4 h-4" />
          ไฮไลต์อัตโนมัติ
        </Button>
      </div>
      {uploadError && <p className="px-4 pb-2 text-xs text-destructive">{uploadError}</p>}
      {subtitleError && <p className="px-4 pb-2 text-xs text-destructive">{subtitleError}</p>}
      {silenceError && <p className="px-4 pb-2 text-xs text-destructive">{silenceError}</p>}
    </aside>
  );
}
