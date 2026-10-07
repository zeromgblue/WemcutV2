"use client";

import { useLinkStatus } from "next/link";

// Label for a <Link> styled as a button: swaps to a spinner while the
// navigation is pending, without changing the button's size.
export function LinkLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span
        className="inline-flex items-center gap-2.5 transition-opacity duration-150"
        style={{ opacity: pending ? 0 : 1 }}
      >
        {children}
      </span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="lp-spinner" />
        </span>
      )}
    </>
  );
}
