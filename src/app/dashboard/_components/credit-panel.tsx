import type { CreditCost, CreditStatus, CreditTransaction } from "@/lib/credits";
import { formatRelativeTime } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro" };

// Below this share of the allowance the bar and number turn amber, then red.
const LOW_SHARE = 0.25;
const CRITICAL_SHARE = 0.1;

function formatResetDate(iso: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(iso));
}

export function CreditPanel({
  status,
  costs,
  transactions,
}: {
  status: CreditStatus;
  costs: CreditCost[];
  transactions: CreditTransaction[];
}) {
  const usedPercent = status.granted > 0 ? Math.min(100, Math.round((status.used / status.granted) * 100)) : 0;
  const remainingShare = status.granted > 0 ? status.remaining / status.granted : 0;
  const tone =
    remainingShare <= CRITICAL_SHARE ? "var(--lp-red)" : remainingShare <= LOW_SHARE ? "#f5b544" : "#ffffff";
  const labelFor = (reason: string | null) => costs.find((c) => c.action === reason)?.label ?? reason ?? "การใช้งาน";

  return (
    <section
      aria-label="เครดิต"
      className="grid lg:grid-cols-[1.4fr_1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]"
      style={{ border: "1px solid var(--lp-line)", background: "rgba(10,10,10,0.6)" }}
    >
      {/* Balance */}
      <div className="p-7">
        <div className="flex items-center justify-between">
          <p className="lp-mono text-[11px] tracking-[0.2em]" style={{ color: "var(--lp-red)" }}>
            เครดิตคงเหลือ
          </p>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ border: "1px solid var(--lp-line)", color: "var(--lp-text-2)" }}
          >
            แพ็กเกจ {PLAN_LABELS[status.plan] ?? status.plan}
          </span>
        </div>

        <p className="mt-4 flex items-baseline gap-2">
          <span className="lp-brand text-5xl leading-none" style={{ color: tone }}>
            {status.remaining.toLocaleString("th-TH")}
          </span>
          <span className="text-sm" style={{ color: "var(--lp-text-3)" }}>
            / {status.granted.toLocaleString("th-TH")} เครดิต
          </span>
        </p>

        <div
          role="progressbar"
          aria-label="เครดิตที่ใช้ไป"
          aria-valuemin={0}
          aria-valuemax={status.granted}
          aria-valuenow={status.used}
          className="mt-5 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div className="h-full rounded-full" style={{ width: `${usedPercent}%`, background: "var(--lp-red)" }} />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--lp-text-2)" }}>
          <span>
            ใช้ไป {status.used.toLocaleString("th-TH")} เครดิต ({usedPercent}%)
          </span>
          <span style={{ color: "var(--lp-text-3)" }}>รีเซ็ต {formatResetDate(status.periodEnd)}</span>
        </div>

        {status.remaining === 0 && (
          <p className="mt-4 text-xs" style={{ color: "#ff8a80" }}>
            เครดิตหมดแล้ว ฟีเจอร์ AI จะกลับมาใช้ได้เมื่อเครดิตรีเซ็ต
          </p>
        )}
      </div>

      {/* Recent activity */}
      <div className="p-7">
        <h3 className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--lp-text-3)" }}>
          การใช้งานล่าสุด
        </h3>
        {transactions.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {tx.type === "grant" ? "เครดิตประจำเดือน" : labelFor(tx.reason)}
                  </span>
                  <span className="block text-[11px]" style={{ color: "var(--lp-text-3)" }}>
                    {formatRelativeTime(tx.createdAt)}
                  </span>
                </span>
                <span className="lp-mono shrink-0 text-xs" style={{ color: tx.amount > 0 ? "#7ee2a8" : "var(--lp-text-2)" }}>
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm" style={{ color: "var(--lp-text-3)" }}>
            ยังไม่มีการใช้เครดิต
          </p>
        )}
      </div>

      {/* Price list */}
      <div className="p-7">
        <h3 className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--lp-text-3)" }}>
          เครดิตต่อการใช้งาน
        </h3>
        <ul className="mt-3 space-y-2.5">
          {costs.map((cost) => (
            <li key={cost.action} className="flex items-baseline justify-between gap-3 text-sm">
              <span style={{ color: "rgba(255,255,255,0.75)" }}>{cost.label}</span>
              <span className="lp-mono shrink-0 text-xs" style={{ color: "var(--lp-text-2)" }}>
                {cost.cost}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
