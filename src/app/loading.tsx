import { landingFonts } from "./fonts";
import "./landing.css";

export default function Loading() {
  return (
    <div className={`lp lp-loader lp-grid ${landingFonts}`} role="status" aria-live="polite">
      <span className="lp-brand lp-loader-logo">WemCut</span>
      <span className="lp-loader-track" aria-hidden>
        <span className="lp-loader-bar" />
      </span>
      <span className="lp-mono lp-loader-tag">กำลังเตรียมหน้าให้คุณ</span>
    </div>
  );
}
