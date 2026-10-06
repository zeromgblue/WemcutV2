import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai, Space_Grotesk } from "next/font/google";
import { ArrowRight, Captions, Scissors, Sparkles } from "lucide-react";
import { CursorGlow } from "./_components/cursor-glow";
import "./landing.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// ─── Data ────────────────────────────────────────────────
const NAV = [
  { href: "#features", label: "ฟีเจอร์" },
  { href: "#how-it-works", label: "วิธีใช้งาน" },
];

const TRUST = ["ไม่ต้องตัดวิดีโอเอง", "ไม่ต้องพิมพ์ซับไตเติ้ลเอง", "เข้าสู่ระบบด้วย Google"];

const FEATURES = [
  {
    icon: Scissors,
    title: "AI ตัดคลิปให้เอง",
    desc: "อัปโหลดวิดีโอยาว AI จะวิเคราะห์และตัดช่วงที่น่าสนใจออกมาให้ ไม่ต้องลากไทม์ไลน์เอง",
  },
  {
    icon: Captions,
    title: "ซับไตเติ้ลอัตโนมัติ",
    desc: "AI แปลงเสียงพูดเป็นข้อความและซิงค์ซับไตเติ้ลให้แม่นยำ ไม่ต้องพิมพ์หรือจับเวลาเอง",
  },
  {
    icon: Sparkles,
    title: "รับคลิปพร้อมใช้",
    desc: "ดาวน์โหลดคลิปพร้อมซับไตเติ้ล นำไปโพสต์บน YouTube, TikTok หรือ Instagram ได้ทันที",
  },
];

const STEPS = [
  { title: "อัปโหลดวิดีโอ", desc: "ลากไฟล์มาวาง หรือวางลิงก์ YouTube — รองรับทุกรูปแบบ ทำได้ในไม่กี่วินาที" },
  { title: "AI ประมวลผล", desc: "ระบบจะตัดคลิปและใส่ซับไตเติ้ลให้อัตโนมัติ คุณไม่ต้องทำอะไรเพิ่มเลย" },
  { title: "รับคลิปพร้อมแชร์", desc: "ดาวน์โหลดผลลัพธ์ที่ได้ แล้วนำไปใช้งานในทุกแพลตฟอร์มได้เลยทันที" },
];

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Building blocks ───────────────────────────────────────
function SectionHeading({ eyebrow, lead, rest }: { eyebrow: string; lead: string; rest: string }) {
  return (
    <div>
      <p className="lp-mono text-[11px] tracking-[0.2em]" style={{ color: "var(--lp-red)" }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[clamp(1.9rem,4.2vw,3rem)] font-bold leading-[1.2] tracking-tight">
        {lead} <span style={{ color: "rgba(255,255,255,0.3)" }}>{rest}</span>
      </h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className={`lp relative min-h-screen overflow-x-hidden ${grotesk.variable} ${plexThai.variable} ${plexMono.variable}`}>
      {/* ══ INTRO ══ */}
      <div className="lp-intro lp-grid" aria-hidden>
        <span className="lp-brand lp-intro-logo">WemCut</span>
        <span className="lp-intro-rule" />
        <span className="lp-mono lp-intro-tag">AI-POWERED VIDEO EDITOR</span>
      </div>

      {/* ══ NAV ══ */}
      <header
        className="lp-nav fixed inset-x-0 top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(10,10,10,0.72)", borderBottom: "1px solid var(--lp-line)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-[68px] grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="lp-brand text-lg justify-self-start">
            WemCut
          </Link>

          <nav className="hidden sm:flex items-center gap-8">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm transition-colors hover:text-white"
                style={{ color: "var(--lp-text-2)" }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <Link href="/login" className="lp-btn-ghost col-start-3 justify-self-end rounded-lg px-4 py-2 text-sm font-semibold">
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section
        className="relative flex min-h-[88vh] items-center justify-center px-6 pt-[68px]"
        style={{ borderBottom: "1px solid var(--lp-line)" }}
      >
        <CursorGlow />
        <div className="lp-grid absolute inset-0 pointer-events-none" />
        <div
          className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(150,38,20,0.2), transparent)" }}
        />

        <div className="relative flex flex-col items-center text-center py-20">
          <span
            className="lp-enter inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--lp-red)" }} />
            AI-Powered Video Tool
          </span>

          <h1
            className="lp-enter mt-8 text-[clamp(2.5rem,7.2vw,4.5rem)] font-bold leading-[1.2] tracking-tight"
            style={{ "--d": "0.08s" } as React.CSSProperties}
          >
            แค่อัปโหลด
            <br />
            <span style={{ color: "rgba(255,255,255,0.32)" }}>AI ทำที่เหลือให้ทั้งหมด</span>
          </h1>

          <p
            className="lp-enter mt-7 max-w-[30rem] text-base sm:text-lg leading-[1.75]"
            style={{ color: "var(--lp-text-2)", "--d": "0.16s" } as React.CSSProperties}
          >
            WemCut ใช้ AI ตัดคลิปและใส่ซับไตเติ้ลให้อัตโนมัติ ไม่ต้องแตะไทม์ไลน์ ไม่ต้องพิมพ์ซับเอง อัปโหลดปุ๊บ
            รับคลิปพร้อมใช้ปั๊บ
          </p>

          <Link
            href="/login"
            className="lp-enter lp-btn-solid mt-10 inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold"
            style={{ "--d": "0.24s" } as React.CSSProperties}
          >
            เริ่มต้นใช้งาน <ArrowRight className="h-4 w-4" />
          </Link>

          <ul
            className="lp-enter mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs"
            style={{ color: "var(--lp-text-3)", "--d": "0.32s" } as React.CSSProperties}
          >
            {TRUST.map((t, i) => (
              <li key={t} className="flex items-center gap-8">
                {i > 0 && <span className="hidden sm:block h-3 w-px" style={{ background: "var(--lp-line)" }} />}
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="relative scroll-mt-[68px] py-24 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="AI ทำให้ทั้งหมด" lead="คุณแค่อัปโหลด" rest="ที่เหลือไม่ต้องทำ" />
            <p className="max-w-[20rem] text-sm leading-relaxed lg:pb-2" style={{ color: "var(--lp-text-3)" }}>
              ระบบ AI วิเคราะห์วิดีโอของคุณ แล้วตัดและใส่ซับให้พร้อมกันเลย
            </p>
          </div>

          <div
            className="mt-14 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]"
            style={{ border: "1px solid var(--lp-line)" }}
          >
            {FEATURES.map((f, i) => (
              <div key={f.title} className="lp-cell p-10">
                <div className="relative flex items-start justify-between">
                  <div className="lp-cell-icon flex h-10 w-10 items-center justify-center">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="lp-mono text-[10px]" style={{ color: "var(--lp-text-3)" }}>
                    {pad(i + 1)}
                  </span>
                </div>
                <h3 className="relative mt-7 text-xl font-bold">{f.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section
        id="how-it-works"
        className="relative scroll-mt-[68px] py-24 lg:py-28"
        style={{ borderTop: "1px solid var(--lp-line)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading eyebrow="ง่ายแค่ 3 ขั้นตอน" lead="จากวิดีโอดิบ" rest="สู่คลิปพร้อมแชร์" />

          <ol className="mt-14" style={{ borderTop: "1px solid var(--lp-line)" }}>
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="lp-step grid gap-x-6 gap-y-2 py-9 md:grid-cols-[160px_245px_1fr] md:items-center"
                style={{ borderBottom: "1px solid var(--lp-line)" }}
              >
                <span className="lp-mono lp-step-num text-[11px]">{pad(i + 1)}</span>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  {s.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section
        className="relative py-24"
        style={{
          borderTop: "1px solid var(--lp-line)",
          background:
            "radial-gradient(ellipse 80% 120% at 50% 0%, rgba(120,40,22,0.34), rgba(40,16,10,0.3) 60%, transparent), #0d0908",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              ไม่ต้องตัดต่อวิดีโออีกต่อไป
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.25rem)] font-bold leading-[1.2] tracking-tight">
              ให้ AI ทำงาน
              <br />
              <span style={{ color: "rgba(235,215,205,0.5)" }}>แทนคุณตั้งแต่วันนี้</span>
            </h2>
          </div>
          <Link
            href="/login"
            className="lp-btn-ghost inline-flex shrink-0 items-center gap-2.5 self-start rounded-xl px-7 py-4 text-sm font-bold md:self-auto"
          >
            เริ่มต้นใช้งาน <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: "1px solid var(--lp-line)", background: "#0a0b0d" }}>
        <div className="max-w-6xl mx-auto px-6 xl:px-0 h-[76px] flex items-center justify-between">
          <span className="lp-brand" style={{ color: "rgba(255,255,255,0.8)" }}>
            WemCut
          </span>
          <p className="lp-brand text-xs font-normal" style={{ color: "var(--lp-text-3)" }}>
            © 2026 WemCut
          </p>
        </div>
      </footer>
    </div>
  );
}
