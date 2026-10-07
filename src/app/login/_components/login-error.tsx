"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  "auth-unavailable": "ระบบล็อกอินขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่",
  "google-oauth-failed": "เชื่อมต่อกับ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
};

// Reads ?error= on the client so the login page itself stays static.
export function LoginError() {
  const error = useSearchParams().get("error");
  if (!error) return null;

  return (
    <p
      role="alert"
      className="mt-5 rounded-lg px-4 py-3 text-left text-sm"
      style={{
        color: "#ff8a80",
        border: "1px solid rgba(229,72,59,0.35)",
        background: "rgba(229,72,59,0.08)",
      }}
    >
      {MESSAGES[error] ?? `เข้าสู่ระบบไม่สำเร็จ: ${error}`}
    </p>
  );
}
