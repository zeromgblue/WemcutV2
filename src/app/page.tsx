"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Bot, Scissors, MessageSquare, Video, Wand2, LayoutTemplate, Sparkles, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="relative min-h-screen bg-[#04040a] text-white overflow-x-hidden">

      {/* ── Animated Mesh Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Main gradient orbs */}
        <motion.div
          className="absolute top-[-15%] left-[-10%] h-[70vh] w-[70vh] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(109,40,217,0.35) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.2, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[20%] right-[-15%] h-[60vh] w-[60vh] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, -50, 20, 0],
            y: [0, 50, -30, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[30%] h-[50vh] w-[50vh] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
          animate={{
            x: [0, -40, 60, 0],
            y: [0, -60, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />
        {/* Subtle noise/grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 z-50 w-full"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-10 pt-6">
          <div className="flex h-14 items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-5 backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600"
              >
                <Wand2 className="h-4 w-4 text-white" />
              </motion.div>
              <span className="text-base font-semibold tracking-tight">WemCut</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
              {["ฟีเจอร์", "วิธีใช้งาน", "ราคา"].map((item, i) => (
                <Link
                  key={item}
                  href={`#${["features", "how-it-works", "pricing"][i]}`}
                  className="hover:text-white transition-colors duration-200"
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors hidden sm:block">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-all duration-200"
              >
                เริ่มต้นฟรี <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <main>
        {/* ── HERO ── */}
        <section ref={heroRef} className="relative flex min-h-screen items-center justify-center px-6 text-center">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-7"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-300"
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-violet-400"
              />
              AI Director เวอร์ชันใหม่ พร้อมใช้งานแล้ว
            </motion.div>

            {/* Headline */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1] text-white"
              >
                แค่สั่งด้วยข้อความ
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #38bdf8 100%)" }}
                >
                  วิดีโอก็สำเร็จ
                </span>
              </motion.h1>
            </div>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              className="max-w-lg text-lg text-white/40 leading-relaxed font-light"
            >
              ตัดต่อวิดีโอด้วย AI ที่เข้าใจภาษาไทย ถอดซับ ตัดช่วงเงียบ
              และค้นหาไฮไลท์ไวรัลให้คุณโดยอัตโนมัติ
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
              >
                เริ่มต้นใช้งานฟรี
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/8 hover:text-white backdrop-blur-sm transition-all duration-300"
              >
                ดูฟีเจอร์ทั้งหมด
              </Link>
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-[-12vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="h-5 w-5 text-white/20" />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="relative z-10 py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            {/* Section label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-16 text-center"
            >
              <p className="mb-3 text-xs uppercase tracking-widest text-violet-400 font-medium">ความสามารถ</p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
                ทุกอย่างที่ครีเอเตอร์ต้องการ
              </h2>
              <p className="mt-4 text-white/40 text-base max-w-lg mx-auto font-light leading-relaxed">
                เครื่องมือ AI ที่ออกแบบมาเพื่อภาษาไทยโดยเฉพาะ ทำงานแทนคุณได้ทุกขั้นตอน
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 }}
                  whileHover={{ y: -6, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6 cursor-default"
                >
                  {/* Hover glow */}
                  <motion.div
                    className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.15), transparent 60%)" }}
                  />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                      {f.icon}
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                    <p className="text-sm text-white/45 leading-relaxed font-light">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="relative z-10 py-28 border-y border-white/5">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-16 text-center"
            >
              <p className="mb-3 text-xs uppercase tracking-widest text-blue-400 font-medium">วิธีใช้งาน</p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">เริ่มได้ใน 4 ขั้นตอน</h2>
              <p className="mt-4 text-white/40 text-base max-w-lg mx-auto font-light leading-relaxed">
                จากวิดีโอดิบสู่คอนเทนต์พร้อมโพสต์ในเวลาเพียงไม่กี่นาที
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  className="flex flex-col gap-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-sm font-medium text-white/30 group-hover:border-violet-500/40 group-hover:text-violet-400 transition-colors duration-300">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-px bg-white/8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1.5">{s.title}</h3>
                    <p className="text-sm text-white/40 font-light leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="relative z-10 py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-16 text-center"
            >
              <p className="mb-3 text-xs uppercase tracking-widest text-pink-400 font-medium">ราคา</p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">เลือกแผนที่ใช่สำหรับคุณ</h2>
              <p className="mt-4 text-white/40 text-base font-light">เริ่มต้นฟรีไม่ต้องใส่บัตรเครดิต</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {/* Starter */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-7 flex flex-col gap-6"
              >
                <div>
                  <p className="text-sm text-white/40 mb-1">Starter</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-semibold">ฟรี</span>
                    <span className="text-white/30 text-sm pb-1">/ตลอดไป</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {["100 เครดิต/เดือน", "วิดีโอสูงสุด 10 นาที", "ซับไตเติ้ลอัตโนมัติ"].map(t => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-white/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/30 shrink-0" />{t}
                    </li>
                  ))}
                  <li className="flex items-center gap-2.5 text-sm text-white/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/10 shrink-0" />มีลายน้ำ WemCut
                  </li>
                </ul>
                <Link
                  href="/dashboard"
                  className="mt-auto inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white/60 hover:bg-white/8 hover:text-white transition-all duration-200"
                >
                  เริ่มต้นฟรี
                </Link>
              </motion.div>

              {/* Pro */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="relative rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/[0.12] to-transparent p-7 flex flex-col gap-6 overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
                  style={{ background: "radial-gradient(ellipse at top, rgba(109,40,217,0.15), transparent 70%)" }}
                />
                <div className="absolute top-0 right-0">
                  <div className="rounded-bl-xl rounded-tr-2xl bg-violet-500 px-3 py-1 text-xs font-medium text-white">
                    แนะนำ
                  </div>
                </div>
                <div className="relative">
                  <p className="text-sm text-violet-400 mb-1">Pro Creator</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-semibold">฿500</span>
                    <span className="text-white/30 text-sm pb-1">/เดือน</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 relative">
                  {["1,000 เครดิต/เดือน", "วิดีโอสูงสุด 60 นาที", "ไม่มีลายน้ำ", "Highlight & Remove Silence", "Export 4K"].map(t => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />{t}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className="relative mt-auto inline-flex items-center justify-center rounded-xl bg-white py-2.5 text-sm font-medium text-black hover:bg-white/90 transition-all duration-200 hover:scale-[1.02]"
                >
                  อัปเกรดเป็น Pro
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-6xl px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
              <Wand2 className="h-3.5 w-3.5 text-white/50" />
            </div>
            <span className="text-sm font-semibold text-white/60">WemCut</span>
          </div>
          <p className="text-xs text-white/25">&copy; {new Date().getFullYear()} WemCut · สำหรับครีเอเตอร์ชาวไทย</p>
          <div className="flex gap-5 text-xs text-white/25">
            <Link href="#" className="hover:text-white/50 transition-colors">ข้อตกลง</Link>
            <Link href="#" className="hover:text-white/50 transition-colors">ความเป็นส่วนตัว</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: <Bot className="h-5 w-5" />, title: "AI Director", desc: "พิมพ์คำสั่งเป็นภาษาไทย AI จะตัดต่อวิดีโอให้คุณโดยอัตโนมัติ ไม่ต้องแตะไทม์ไลน์เลย" },
  { icon: <MessageSquare className="h-5 w-5" />, title: "AI Subtitle", desc: "ถอดเสียงภาษาไทยแม่นยำสูง พร้อมดีไซน์ซับสวยงามสำหรับคลิปไวรัลโดยเฉพาะ" },
  { icon: <Scissors className="h-5 w-5" />, title: "Remove Silence", desc: "ตัดช่วงเงียบออกอัตโนมัติ ทำให้วิดีโอกระชับและน่าดูขึ้นโดยไม่ต้องทำเอง" },
  { icon: <Video className="h-5 w-5" />, title: "Highlight Detection", desc: "ค้นหาช่วงที่น่าสนใจที่สุดของวิดีโอยาวและตัดเป็นคลิปสั้นสำหรับ TikTok/Reels" },
  { icon: <LayoutTemplate className="h-5 w-5" />, title: "Subtitle Templates", desc: "เทมเพลตซับไตเติ้ลกว่า 10 แบบ ปรับสี ขนาด และสไตล์ให้ตรงกับแบรนด์ของคุณ" },
  { icon: <Sparkles className="h-5 w-5" />, title: "Cloud Export", desc: "เรนเดอร์บนคลาวด์ไวด์ ปรับขนาดให้พอดีกับทุกแพลตฟอร์มโดยอัตโนมัติ" },
];

const steps = [
  { title: "อัปโหลดวิดีโอ", desc: "ลากวางไฟล์วิดีโอที่ต้องการตัดต่อ รองรับสูงสุด 60 นาที" },
  { title: "สั่งงาน AI", desc: "พิมพ์สิ่งที่ต้องการเป็นภาษาธรรมชาติ หรือเลือกใช้พรีเซ็ตสำเร็จรูป" },
  { title: "ปรับแต่ง", desc: "ดูตัวอย่างและแก้ไขละเอียดเพิ่มเติมบน Editor ที่ใช้งานง่าย" },
  { title: "ส่งออก", desc: "ดาวน์โหลดวิดีโอคุณภาพสูงพร้อมโพสต์สร้างยอดวิวได้ทันที" },
];
