import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { createProject } from "@/app/actions/projects";
import { formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <form action={createProject}>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </form>
            <form action={logout}>
              <Button
                type="submit"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                ออกจากระบบ
              </Button>
            </form>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 mb-6">
            สร้างโปรเจกต์ไม่สำเร็จ ลองใหม่อีกครั้ง
          </p>
        )}

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/editor/${project.id}`}>
                <div className="border border-slate-800 rounded-xl bg-slate-900/50 p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-slate-800/50 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                    <FolderOpen className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                  </div>
                  <h3 className="font-medium text-slate-300 group-hover:text-white">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    แก้ไข {formatRelativeTime(project.updated_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-800 rounded-xl bg-slate-900/30 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="font-medium text-slate-300">ยังไม่มีโปรเจกต์</h3>
            <p className="text-xs text-slate-500 mt-2">
              เริ่มสร้างโปรเจกต์แรกของคุณด้วยปุ่ม &quot;New Project&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
