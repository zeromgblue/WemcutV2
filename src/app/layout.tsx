import type { Metadata } from "next";
import { Kanit, Prompt, Sarabun } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

// Prompt and Sarabun are only used for subtitle styling in the editor, so they
// load on demand instead of being preloaded on every page.
const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "WemCut - AI Video Editor",
  description: "พิมพ์สิ่งที่ต้องการ แล้ว WemCut ทำให้สำเร็จ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${kanit.variable} ${prompt.variable} ${sarabun.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">{children}</body>
    </html>
  );
}
