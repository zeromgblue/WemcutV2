"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Scissors, Wand2, Mic2, Music,
  Menu, X, Check, Play, Zap, Layers,
  MessageSquare, Film, Download, Clock, Globe,
  Volume2, LayoutTemplate, ChevronDown,
} from "lucide-react";

// ─── Design tokens — warm espresso brown, minimal ─────────
const T = {
  bg:         "#0B0806",
  surface:    "#16100A",
  surfaceAlt: "#1D1610",
  border:     "rgba(243,234,217,0.08)",
  borderHi:   "rgba(201,161,92,0.4)",
  gold:       "#C9A15C",
  goldBright: "#E8C27A",
  copper:     "#7A4A22",
  ink:        "#1A0F06",
  cream:      "#F3EAD9",
  text2:      "rgba(243,234,217,0.62)",
  text3:      "rgba(243,234,217,0.4)",
};

const gradGold = `linear-gradient(135deg, ${T.gold}, ${T.copper})`;

// ─── Data ────────────────────────────────────────────────
const NAV = [
  { href: "#features",     label: "ฟีเจอร์" },
  { href: "#how-it-works", label: "วิธีใช้" },
  { href: "#pricing",      label: "ราคา" },
  { href: "#faq",          label: "คำถาม" },
];

const AI_TOOLS = [
  { label: "AI Subtitle",         icon: Scissors },
  { label: "Highlight Detection", icon: Zap },
  { label: "Remove Silence",      icon: Volume2 },
  { label: "AI Voiceover",        icon: Mic2 },
  { label: "Sound Effect",        icon: Music },
  { label: "Timeline Edit",       icon: Layers },
];

const FEATURES = [
  { icon: Wand2,         title: "AI Director",         desc: "พิมพ์คำสั่งภาษาไทยธรรมชาติ — AI วางแผนและดำเนินการตัดต่อให้ครบ โดยที่คุณไม่ต้องแตะ Timeline แม้แต่ครั้งเดียว", wide: true },
  { icon: Scissors,      title: "AI ตัดต่ออัตโนมัติ",  desc: "ตัดความเงียบ ค้นหาไฮไลท์ ปรับจังหวะ ด้วย AI ใน 1 คำสั่ง", wide: false },
  { icon: MessageSquare, title: "AI Subtitle ภาษาไทย", desc: "ถอดเสียง + ใส่ซับแม่นยำ รองรับทุกสำเนียง พร้อม Highlight คำสำคัญ", wide: false },
  { icon: Film,          title: "Timeline Engine",     desc: "แก้ไข Timeline แบบ frame-accurate รองรับ Undo/Redo ทุก AI Action", wide: true },
];

const MINI = [
  { icon: Download,       title: "Export Full HD",          desc: "Render บน Cloud ไม่กินเครื่อง" },
  { icon: LayoutTemplate, title: "TikTok / Reels / Shorts", desc: "Mode สำเร็จรูปสำหรับ Short-form" },
  { icon: Globe,          title: "AI Sound & Voiceover",    desc: "Text-to-Speech + Sound Effect AI" },
  { icon: Clock,          title: "Credit System",           desc: "จ่ายตามการใช้งานจริง ไม่มีค่าซ่อน" },
];

const STEPS = [
  { title: "อัปโหลดวิดีโอ",   desc: "อัปโหลดไฟล์หรือลิงก์ ระบบ Cloud จัดการให้ทั้งหมด" },
  { title: "สั่ง AI ภาษาไทย", desc: 'พิมพ์เช่น "ตัดความเงียบ ใส่ซับ หาไฮไลท์" — AI Director วางแผนและดำเนินการให้ครบ' },
  { title: "Preview & แก้ไข", desc: "ตรวจ Timeline ปรับละเอียดได้ทุกอย่าง รองรับ Undo/Redo" },
  { title: "Export & โพสต์",  desc: "Render Full HD บน Cloud โหลดไฟล์พร้อมลงทุกแพลตฟอร์ม" },
];

const PLANS = [
  {
    name: "Free", price: "0", cycle: "ตลอดชีพ", credits: "100 เครดิต / เดือน",
    featured: false, cta: "เริ่มต้นฟรี", href: "/signup",
    items: [
      { ok: true,  t: "100 Credits / เดือน" },
      { ok: true,  t: "AI Subtitle" },
      { ok: true,  t: "Basic AI Edit" },
      { ok: false, t: "AI Director (Full)" },
      { ok: false, t: "Highlight Detection" },
      { ok: false, t: "AI Voice & Sound" },
    ],
  },
  {
    name: "Pro", badge: "แนะนำ", price: "500", cycle: "/ เดือน", credits: "1,000 เครดิต / เดือน",
    featured: true, cta: "ทดลองฟรี 7 วัน", href: "/signup?plan=pro",
    items: [
      { ok: true, t: "1,000 Credits / เดือน" },
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
  { action: "สร้าง Project",       cost: 5  },
  { action: "AI Subtitle",         cost: 10 },
  { action: "Remove Silence",      cost: 10 },
  { action: "Highlight Detection", cost: 20 },
  { action: "Full AI Edit",        cost: 50 },
];

const FAQS = [
  { q: "WemCut แตกต่างจากโปรแกรมตัดต่อทั่วไปอย่างไร?", a: "WemCut ใช้ AI Director รับคำสั่งภาษาไทยธรรมชาติ วางแผนและดำเนินการตัดต่อให้ครบ — ไม่ต้องลาก Timeline เองเลย" },
  { q: "เครดิตหมดแล้วจะเป็นอย่างไร?",                 a: "Free Plan รีเซ็ตทุกเดือน Pro Plan สามารถซื้อเครดิตเพิ่มได้ หรืออัปเกรดแผน" },
  { q: "ข้อมูลวิดีโอของฉันปลอดภัยไหม?",               a: "ไฟล์เก็บบน Cloudflare R2 ด้วย Signed URL ทุก Action บันทึก Log และมี Row Level Security ปกป้องข้อมูล" },
  { q: "รองรับภาษาอะไรบ้าง?",                         a: "รองรับภาษาไทยเป็นหลัก และรองรับภาษาอังกฤษ รวมถึงภาษาอื่นๆ ผ่าน AI Speech-to-Text" },
];

// ─── Building blocks ───────────────────────────────────────
function Rule({ center = false }: { center?: boolean }) {
  return <span className={`block w-9 h-px mb-4 ${center ? "mx-auto" : ""}`} style={{ background: T.gold }} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide"
      style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.gold }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.gold }} />
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, sub, center = true }: {
  eyebrow: string; title: string; sub?: string; center?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 max-w-2xl ${center ? "items-center text-center mx-auto" : "items-start"}`}>
      <Rule center={center} />
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight leading-tight" style={{ color: T.cream }}>
        {title}
      </h2>
      {sub && <p className="text-sm leading-relaxed" style={{ color: T.text2 }}>{sub}</p>}
    </div>
  );
}

function PrimaryButton({ href, children, size = "md", className = "" }: {
  href: string; children: React.ReactNode; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const pad = size === "sm" ? "px-5 py-2.5 text-sm" : size === "lg" ? "px-9 py-4 text-base" : "px-7 py-3.5 text-sm";
  return (
    <Link href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-transform hover:scale-[1.02] ${pad} ${className}`}
      style={{
        background: gradGold, color: T.ink,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.12), 0 10px 24px -10px rgba(0,0,0,0.55)",
      }}>
      {children}
    </Link>
  );
}

function GhostButton({ href, children, size = "md", className = "" }: {
  href: string; children: React.ReactNode; size?: "sm" | "md" | "lg"; className?: string;
}) {
  const pad = size === "sm" ? "px-5 py-2.5 text-sm" : size === "lg" ? "px-9 py-4 text-base" : "px-7 py-3.5 text-sm";
  return (
    <a href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors hover:bg-white/[0.04] ${pad} ${className}`}
      style={{ border: `1px solid ${T.border}`, color: T.cream }}>
      {children}
    </a>
  );
}

function LogLine({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent ? T.goldBright : T.text3 }} />
      <span className="text-xs font-mono" style={{ color: T.text2 }}>{text}</span>
    </div>
  );
}

// ─── Backdrop — one quiet ambient glow, no motion ─────────
function Backdrop() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: T.bg }}>
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[120%] h-[60vh] rounded-full blur-3xl"
        style={{ background: `radial-gradient(ellipse at center, ${T.copper}26 0%, transparent 65%)` }} />
      <div className="absolute bottom-[-15%] left-[10%] w-[70%] h-[45vh] rounded-full blur-3xl"
        style={{ background: `radial-gradient(ellipse at center, ${T.gold}14 0%, transparent 70%)` }} />
      <div className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 55% 45% at 50% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 55% 45% at 50% 0%, black, transparent)",
        }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq,  setOpenFaq]  = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans" style={{ background: T.bg, color: T.cream }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up  { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-1  { animation-delay: 0.1s; }
        .delay-2  { animation-delay: 0.2s; }
      `}</style>

      <Backdrop />

      <div className="relative z-10">
        {/* ══ NAV ══ */}
        <header className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
          style={{
            background: scrolled ? "rgba(11,8,6,0.92)" : "rgba(11,8,6,0.35)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
          }}>
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 68 }}>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: gradGold }}>
                <Scissors className="w-4 h-4" style={{ color: T.ink }} />
              </div>
              <span className="font-heading text-lg font-medium tracking-tight">
                Wem<span style={{ color: T.gold }}>Cut</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {NAV.map(l => (
                <a key={l.href} href={l.href} className="text-sm font-medium transition-colors hover:opacity-100"
                  style={{ color: T.text2, opacity: 0.85 }}>
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium" style={{ color: T.text2 }}>
                เข้าสู่ระบบ
              </Link>
              <PrimaryButton href="/signup" size="sm">เริ่มต้นฟรี</PrimaryButton>
            </div>

            <button className="md:hidden p-2" style={{ color: T.cream }} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden px-6 py-4 space-y-3 border-t" style={{ background: T.bg, borderColor: T.border }}>
              {NAV.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium" style={{ color: T.text2 }}>
                  {l.label}
                </a>
              ))}
              <PrimaryButton href="/signup" className="w-full mt-2">เริ่มต้นฟรี</PrimaryButton>
            </div>
          )}
        </header>

        {/* ══ HERO ══ */}
        <section className="relative px-6 pt-36 pb-24 md:pt-44 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl fade-up">
              <Rule />
              <Eyebrow>AI Video Editor · สั่งงานด้วยภาษาไทย</Eyebrow>
              <h1 className="font-heading mt-6 text-4xl md:text-6xl font-medium tracking-tight leading-[1.12]" style={{ color: T.cream }}>
                ตัดต่อวิดีโอด้วย <span style={{ color: T.gold }}>AI</span>
                <br />แค่พิมพ์คำสั่ง
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed max-w-xl" style={{ color: T.text2 }}>
                WemCut คือ AI Video Editor ที่รับคำสั่งภาษาไทยธรรมชาติ — ตัด ใส่ซับ ไฮไลท์ เพิ่มเสียง
                และ Export ให้เสร็จ โดยที่คุณไม่ต้องแตะ Timeline แม้แต่ครั้งเดียว
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-4">
                <PrimaryButton href="/signup" size="lg">
                  เริ่มต้นฟรี <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
                <GhostButton href="#how-it-works" size="lg">
                  <Play className="h-4 w-4" /> ดูวิธีใช้
                </GhostButton>
              </div>
            </div>

            {/* Tool pills */}
            <div className="mt-14 flex flex-wrap gap-2 fade-up delay-1">
              {AI_TOOLS.map(t => (
                <div key={t.label} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium"
                  style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text2 }}>
                  <t.icon className="h-3.5 w-3.5" style={{ color: T.gold }} />
                  {t.label}
                </div>
              ))}
            </div>

            {/* Demo card */}
            <div className="mt-10 max-w-2xl rounded-2xl overflow-hidden fade-up delay-2"
              style={{ background: T.surface, border: `1px solid ${T.border}`,
                       boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)" }}>
              <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: T.border }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.gold }} />
                <span className="text-xs font-mono tracking-wide" style={{ color: T.text3 }}>WemCut AI Director</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <span className="font-mono text-sm" style={{ color: T.gold }}>$</span>
                  <span className="text-sm" style={{ color: T.cream }}>
                    ตัดความเงียบออก ใส่ซับภาษาไทย แล้วหาช่วงไฮไลท์ที่น่าสนใจ
                  </span>
                </div>
                <div className="pl-5 space-y-2.5 border-l" style={{ borderColor: T.border }}>
                  <LogLine text="analyze_video() → พบวิดีโอ 12:34 นาที" />
                  <LogLine text="transcribe_audio() → ความแม่นยำ 98.2%" />
                  <LogLine text="remove_silence() → ตัด 4 ช่วง (-1:20 นาที)" />
                  <LogLine text="find_highlights() → พบ 3 ไฮไลท์" accent />
                </div>
                <div className="flex items-center gap-2 rounded-lg px-4 py-2.5"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
                  <Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
                  <span className="text-xs font-mono" style={{ color: "#4ade80" }}>
                    เสร็จสิ้น — ประหยัดเวลา 45 นาที · ใช้ 40 Credits
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section id="features" className="relative py-24 lg:py-28" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeading center={false} eyebrow="ฟีเจอร์" title="AI จัดการทุกอย่าง คุณแค่สั่ง"
              sub="จาก 1 คำสั่ง AI วางแผน เรียกใช้ Tool และตัดต่อวิดีโอให้ครบกระบวนการ" />

            <div className="mt-14 grid md:grid-cols-12 gap-4">
              {FEATURES.map((f, i) => (
                <div key={i}
                  className={`rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5 ${f.wide ? "md:col-span-8" : "md:col-span-4"}`}
                  style={{ background: T.surface, border: `1px solid ${T.border}`,
                           boxShadow: "0 20px 40px -28px rgba(0,0,0,0.55)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderHi)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <f.icon className="h-5 w-5" style={{ color: T.gold }} />
                  </div>
                  <h3 className="font-heading text-lg font-medium mb-2" style={{ color: T.cream }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: T.text2 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 border-t pt-8" style={{ borderColor: T.border }}>
              {MINI.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                    <f.icon className="h-4 w-4" style={{ color: T.gold }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: T.cream }}>{f.title}</h4>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: T.text3 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section id="how-it-works" className="relative py-24 lg:py-28" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeading center={false} eyebrow="วิธีใช้" title="4 ขั้นตอน เสร็จใน 5 นาที" />

            <div className="mt-16 grid md:grid-cols-4 gap-10">
              {STEPS.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ background: gradGold, color: T.ink }}>
                      {i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="hidden md:block h-px flex-1" style={{ background: T.border }} />
                    )}
                  </div>
                  <h4 className="font-heading text-lg font-medium mb-2" style={{ color: T.cream }}>{s.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: T.text2 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PRICING ══ */}
        <section id="pricing" className="relative py-24 lg:py-28" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-5xl mx-auto px-6">
            <SectionHeading center={false} eyebrow="ราคา" title="ราคาตรงไปตรงมา ไม่มีค่าซ่อน"
              sub="จ่ายตามการใช้งานจริงด้วยระบบ Credit — ยกเลิกได้ทุกเมื่อ" />

            <div className="mt-14 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {PLANS.map(plan => (
                <div key={plan.name}
                  className={`relative rounded-2xl p-8 ${plan.featured ? "md:-translate-y-2" : ""}`}
                  style={{
                    background: plan.featured ? T.surfaceAlt : T.surface,
                    border: `1px solid ${plan.featured ? "rgba(201,161,92,0.55)" : T.border}`,
                    boxShadow: plan.featured
                      ? "0 24px 48px -24px rgba(201,161,92,0.22), 0 20px 40px -28px rgba(0,0,0,0.5)"
                      : "0 20px 40px -28px rgba(0,0,0,0.5)",
                  }}>
                  {plan.badge && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest rounded-full"
                      style={{ background: gradGold, color: T.ink }}>
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="font-heading text-2xl font-medium mb-1" style={{ color: T.cream }}>{plan.name}</h3>
                  <p className="text-xs mb-5" style={{ color: T.text3 }}>{plan.credits}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-sm" style={{ color: T.text2 }}>฿</span>
                    <span className="font-heading text-4xl font-medium" style={{ color: T.cream }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: T.text3 }}>{plan.cycle}</span>
                  </div>
                  {plan.featured
                    ? <PrimaryButton href={plan.href} className="w-full">{plan.cta}</PrimaryButton>
                    : <GhostButton href={plan.href} className="w-full">{plan.cta}</GhostButton>}
                  <ul className="mt-7 space-y-3">
                    {plan.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        {it.ok
                          ? <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: T.gold }} />
                          : <X className="h-4 w-4 shrink-0 mt-0.5 opacity-30" style={{ color: T.text3 }} />}
                        <span className={it.ok ? "" : "line-through"} style={{ color: it.ok ? T.text2 : T.text3 }}>
                          {it.t}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-16 max-w-md">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: T.text3 }}>
                ต้นทุน Credit ต่อ Action
              </h3>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                {CREDIT_TABLE.map((row, i) => (
                  <div key={i}
                    className={`flex items-center justify-between px-5 py-3.5 text-sm ${i !== CREDIT_TABLE.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: T.border, background: i % 2 === 0 ? T.surface : "transparent" }}>
                    <span style={{ color: T.text2 }}>{row.action}</span>
                    <span className="font-bold" style={{ color: T.gold }}>{row.cost} Credits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq" className="relative py-24 lg:py-28" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-3xl mx-auto px-6">
            <SectionHeading center={false} eyebrow="คำถามที่พบบ่อย" title="มีคำถาม?" />

            <div className="mt-12 space-y-3">
              {FAQS.map((f, i) => (
                <div key={i} className="rounded-xl overflow-hidden transition-colors"
                  style={{ background: T.surface, border: `1px solid ${openFaq === i ? T.borderHi : T.border}` }}>
                  <button className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="text-sm font-semibold" style={{ color: openFaq === i ? T.gold : T.cream }}>
                      {f.q}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform"
                      style={{ color: T.gold, transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-sm leading-relaxed border-t" style={{ borderColor: T.border, color: T.text2 }}>
                      <div className="pt-4">{f.a}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section className="relative py-20 px-6">
          <div className="max-w-4xl mx-auto rounded-3xl p-10 md:p-16"
            style={{ background: T.surface, border: `1px solid ${T.border}`,
                     boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)" }}>
            <Rule />
            <Eyebrow>พร้อมเริ่มแล้ว?</Eyebrow>
            <h2 className="font-heading mt-6 text-3xl md:text-5xl font-medium" style={{ color: T.cream }}>
              ปล่อยให้ AI ตัดต่อ
              <br />
              <span style={{ color: T.gold }}>แทนคุณวันนี้</span>
            </h2>
            <p className="mt-5 text-lg max-w-xl" style={{ color: T.text2 }}>
              เริ่มต้นฟรี 100 Credits ไม่ต้องใส่บัตรเครดิต
            </p>
            <PrimaryButton href="/signup" size="lg" className="mt-8">
              เริ่มต้นฟรีเลย <ArrowRight className="h-5 w-5" />
            </PrimaryButton>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="relative py-10 px-6" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: gradGold }}>
                <Scissors className="w-3.5 h-3.5" style={{ color: T.ink }} />
              </div>
              <span className="font-heading font-medium">
                Wem<span style={{ color: T.gold }}>Cut</span>
              </span>
            </div>
            <div className="flex gap-6">
              {NAV.map(l => (
                <a key={l.href} href={l.href} className="text-sm" style={{ color: T.text3 }}>{l.label}</a>
              ))}
            </div>
            <p className="text-xs" style={{ color: T.text3 }}>© 2025 WemCut. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
