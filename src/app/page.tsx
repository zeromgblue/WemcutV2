import Link from "next/link";
import { ArrowRight, Captions, Check, Scissors, Sparkles, X } from "lucide-react";
import { CursorGlow } from "./_components/cursor-glow";
import { LinkLabel } from "./_components/link-label";
import { landingFonts } from "./fonts";
import "./landing.css";

// ─── Data ────────────────────────────────────────────────
const NAV = [
  { href: "#features", label: "ฟีเจอร์" },
  { href: "#how-it-works", label: "วิธีใช้งาน" },
  { href: "#pricing", label: "ราคา" },
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

const PLANS = [
  {
    name: "Free",
    price: "0",
    cycle: "ตลอดชีพ",
    credits: "100 เครดิต / เดือน",
    featured: false,
    cta: "เริ่มต้นฟรี",
    items: [
      { ok: true, t: "100 เครดิต / เดือน" },
      { ok: true, t: "AI Subtitle" },
      { ok: true, t: "Basic AI Edit" },
      { ok: false, t: "AI Director (Full)" },
      { ok: false, t: "Highlight Detection" },
      { ok: false, t: "AI Voice & Sound" },
    ],
  },
  {
    name: "Pro",
    price: "500",
    cycle: "/ เดือน",
    credits: "1,000 เครดิต / เดือน",
    featured: true,
    cta: "ทดลองฟรี 7 วัน",
    items: [
      { ok: true, t: "1,000 เครดิต / เดือน" },
      { ok: true, t: "AI Director (Full)" },
      { ok: true, t: "AI Subtitle + Highlight" },
      { ok: true, t: "Remove Silence" },
      { ok: true, t: "AI Voice & Sound Effect" },
      { ok: true, t: "TikTok / Reels / Shorts Mode" },
      { ok: true, t: "Export Full HD ไม่มี Watermark" },
    ],
  },
];

const CREDIT_TABLE = [
  { action: "สร้าง Project", cost: 5 },
  { action: "AI Subtitle", cost: 10 },
  { action: "Remove Silence", cost: 10 },
  { action: "Highlight Detection", cost: 20 },
  { action: "Full AI Edit", cost: 50 },
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
    <div className={`lp relative min-h-screen overflow-x-hidden ${landingFonts}`}>
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

          <Link href="/login" className="lp-btn-ghost relative col-start-3 justify-self-end rounded-lg px-4 py-2 text-sm font-semibold">
            <LinkLabel>เข้าสู่ระบบ</LinkLabel>
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
            className="lp-enter lp-btn-solid relative mt-10 inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold"
            style={{ "--d": "0.24s" } as React.CSSProperties}
          >
            <LinkLabel>
              เริ่มต้นใช้งาน <ArrowRight className="h-4 w-4" />
            </LinkLabel>
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

      {/* ══ PRICING ══ */}
      <section
        id="pricing"
        className="relative scroll-mt-[68px] py-24 lg:py-28"
        style={{ borderTop: "1px solid var(--lp-line)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="แพ็กเกจและราคา" lead="เริ่มต้นฟรี" rest="จ่ายเท่าที่ใช้จริง" />
            <p className="max-w-[20rem] text-sm leading-relaxed lg:pb-2" style={{ color: "var(--lp-text-3)" }}>
              คิดตามการใช้งานด้วยระบบเครดิต ไม่มีค่าใช้จ่ายแอบแฝง ยกเลิกได้ทุกเมื่อ
            </p>
          </div>

          <div
            className="mt-14 grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]"
            style={{ border: "1px solid var(--lp-line)" }}
          >
            {PLANS.map((plan, i) => (
              <div key={plan.name} className="lp-cell flex flex-col p-10">
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="lp-brand text-xl">{plan.name}</h3>
                    {plan.featured && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: "var(--lp-red)",
                          border: "1px solid rgba(229,72,59,0.4)",
                          background: "rgba(229,72,59,0.1)",
                        }}
                      >
                        แนะนำ
                      </span>
                    )}
                  </div>
                  <span className="lp-mono text-[10px]" style={{ color: "var(--lp-text-3)" }}>
                    {pad(i + 1)}
                  </span>
                </div>

                <div className="relative mt-7 flex items-baseline gap-1.5">
                  <span className="text-lg" style={{ color: "var(--lp-text-2)" }}>
                    ฿
                  </span>
                  <span className="lp-brand text-5xl">{plan.price}</span>
                  <span className="ml-1 text-sm" style={{ color: "var(--lp-text-3)" }}>
                    {plan.cycle}
                  </span>
                </div>
                <p className="lp-mono relative mt-3 text-[11px] tracking-[0.12em]" style={{ color: "var(--lp-text-3)" }}>
                  {plan.credits}
                </p>

                <ul className="relative mt-8 mb-10 space-y-3">
                  {plan.items.map((it) => (
                    <li key={it.t} className="flex items-start gap-3 text-sm">
                      {it.ok ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--lp-red)" }} />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.18)" }} />
                      )}
                      <span
                        className={it.ok ? "" : "line-through"}
                        style={{ color: it.ok ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.22)" }}
                      >
                        {it.t}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`${plan.featured ? "lp-btn-solid" : "lp-btn-ghost"} relative mt-auto inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold`}
                >
                  <LinkLabel>
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </LinkLabel>
                </Link>
              </div>
            ))}

            <div className="lp-cell flex flex-col p-10">
              <div className="relative flex items-start justify-between">
                <h3 className="text-xl font-bold">เครดิตต่อการใช้งาน</h3>
                <span className="lp-mono text-[10px]" style={{ color: "var(--lp-text-3)" }}>
                  {pad(PLANS.length + 1)}
                </span>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                แต่ละคำสั่งใช้เครดิตไม่เท่ากัน รู้ล่วงหน้าทุกครั้งก่อนกดใช้
              </p>

              <ul className="relative mt-8" style={{ borderTop: "1px solid var(--lp-line)" }}>
                {CREDIT_TABLE.map((row) => (
                  <li
                    key={row.action}
                    className="flex items-center justify-between py-3.5 text-sm"
                    style={{ borderBottom: "1px solid var(--lp-line)" }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.62)" }}>{row.action}</span>
                    <span className="lp-mono text-xs" style={{ color: "var(--lp-text-2)" }}>
                      <span className="text-white">{row.cost}</span> เครดิต
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
            className="lp-btn-ghost relative inline-flex shrink-0 items-center gap-2.5 self-start rounded-xl px-7 py-4 text-sm font-bold md:self-auto"
          >
            <LinkLabel>
              เริ่มต้นใช้งาน <ArrowRight className="h-4 w-4" />
            </LinkLabel>
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
