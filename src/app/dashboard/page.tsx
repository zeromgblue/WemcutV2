import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Film } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { getAuthUser } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { formatRelativeTime } from "@/lib/utils";
import { landingFonts } from "../fonts";
import { NewProjectDialog } from "./_components/new-project-dialog";
import "../landing.css";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { error } = await searchParams;
  const { supabase, user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const count = projects?.length ?? 0;

  return (
    <div className={`lp relative min-h-screen ${landingFonts}`}>
      <div
        className="absolute inset-x-0 top-0 h-80 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(150,38,20,0.22), transparent)" }}
      />
      <div className="lp-grid absolute inset-x-0 top-0 h-80 pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <header className="relative" style={{ borderBottom: "1px solid var(--lp-line)" }}>
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="lp-brand text-lg">
            WemCut
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs" style={{ color: "var(--lp-text-3)" }}>
              {user.email}
            </span>
            <form action={logout}>
              <SubmitButton
                variant="ghost"
                className="lp-btn-ghost h-9 rounded-lg px-4 text-sm font-semibold text-white hover:text-white"
              >
                ออกจากระบบ
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="lp-mono text-[11px] tracking-[0.2em]" style={{ color: "var(--lp-red)" }}>
              {count > 0 ? `${count} โปรเจกต์` : "เริ่มต้นใช้งาน"}
            </p>
            <h1 className="mt-3 text-[clamp(1.9rem,4.2vw,3rem)] font-bold leading-[1.2] tracking-tight">
              โปรเจกต์ <span style={{ color: "rgba(255,255,255,0.3)" }}>ของคุณ</span>
            </h1>
          </div>
          <NewProjectDialog />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-lg px-4 py-3 text-sm"
            style={{ color: "#ff8a80", border: "1px solid rgba(229,72,59,0.35)", background: "rgba(229,72,59,0.08)" }}
          >
            สร้างโปรเจกต์ไม่สำเร็จ ลองใหม่อีกครั้ง
          </p>
        )}

        {projects && projects.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <Link
                key={project.id}
                href={`/editor/${project.id}`}
                className="lp-cell group block p-7"
                style={{ border: "1px solid var(--lp-line)" }}
              >
                <div className="relative flex items-start justify-between">
                  <div className="lp-cell-icon flex h-10 w-10 items-center justify-center">
                    <Film className="h-4 w-4" />
                  </div>
                  <span className="lp-mono text-[10px]" style={{ color: "var(--lp-text-3)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="relative mt-7 flex items-center gap-2 text-lg font-bold">
                  <span className="truncate">{project.name}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h3>
                <p className="relative mt-2 text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
                  แก้ไข {formatRelativeTime(project.updated_at)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="mt-12 flex flex-col items-center justify-center px-6 py-20 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.14)" }}
          >
            <div className="flex h-12 w-12 items-center justify-center" style={{ border: "1px solid var(--lp-line)", color: "var(--lp-red)" }}>
              <Film className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-xl font-bold">ยังไม่มีโปรเจกต์</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--lp-text-2)" }}>
              กด &quot;สร้างโปรเจกต์ใหม่&quot; แล้วอัปโหลดวิดีโอ จากนั้นให้ AI ตัดคลิปและใส่ซับไตเติลให้ได้เลย
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
