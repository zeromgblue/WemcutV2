import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loginWithGoogle } from "@/app/actions/auth";
import { CursorGlow } from "../_components/cursor-glow";
import { landingFonts } from "../fonts";
import { GoogleButton } from "./_components/google-button";
import { LoginError } from "./_components/login-error";
import "../landing.css";

const PERKS = ["ไม่ต้องตั้งรหัสผ่าน", "สมัครและเข้าใช้ในคลิกเดียว", "เริ่มใช้งานได้ทันที"];

export default function LoginPage() {
  return (
    <div className={`lp relative flex min-h-screen flex-col overflow-hidden ${landingFonts}`}>
      <CursorGlow />
      <div className="lp-grid absolute inset-0 pointer-events-none" />
      <div
        className="absolute inset-x-0 bottom-0 h-72 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(150,38,20,0.2), transparent)" }}
      />

      <header className="relative">
        <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="lp-brand text-lg">
            WemCut
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "var(--lp-text-2)" }}
          >
            <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 pb-24 pt-10">
        <div className="lp-rise w-full max-w-[26rem]">
          <div
            className="lp-card relative overflow-hidden p-9 sm:p-10 text-center"
            style={{ border: "1px solid var(--lp-line)", background: "rgba(12,10,10,0.72)" }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--lp-red)" }} />
              เข้าสู่ระบบ
            </span>

            <h1 className="mt-7 text-[2rem] font-bold leading-[1.25] tracking-tight">
              ยินดีต้อนรับ
              <br />
              <span style={{ color: "rgba(255,255,255,0.32)" }}>สู่ WemCut</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--lp-text-2)" }}>
              เข้าสู่ระบบหรือสมัครสมาชิกด้วยบัญชี Google แล้วให้ AI ตัดคลิปแทนคุณได้เลย
            </p>

            <form action={loginWithGoogle} className="mt-9">
              <GoogleButton />
            </form>

            <Suspense fallback={null}>
              <LoginError />
            </Suspense>

            <ul
              className="mt-9 space-y-2.5 pt-7 text-left text-xs"
              style={{ borderTop: "1px solid var(--lp-line)", color: "var(--lp-text-2)" }}
            >
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="h-1 w-1 rounded-full" style={{ background: "var(--lp-red)" }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className="lp-mono mt-6 text-center text-[10px] tracking-[0.28em]" style={{ color: "var(--lp-text-3)" }}>
            AI-POWERED VIDEO EDITOR
          </p>
        </div>
      </main>
    </div>
  );
}
