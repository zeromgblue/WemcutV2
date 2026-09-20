import { Type, Scissors, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { icon: Type, label: "ใส่ซับไตเติลอัตโนมัติ" },
  { icon: Scissors, label: "ลบช่วงเงียบ" },
  { icon: Wand2, label: "ไฮไลต์อัตโนมัติ" },
];

export function ToolsSidebar() {
  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
      <div className="h-10 flex items-center px-4 border-b border-border shrink-0">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          เครื่องมือ AI
        </h2>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {TOOLS.map(({ icon: Icon, label }) => (
          <Button
            key={label}
            variant="ghost"
            className="justify-start gap-3 h-9 px-3 font-normal text-muted-foreground hover:text-foreground"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>
    </aside>
  );
}
