import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that read or change the session. The landing page and static
  // assets skip the proxy entirely, so they are served straight from cache.
  matcher: ["/login", "/auth/:path*", "/dashboard/:path*", "/editor/:path*"],
};
