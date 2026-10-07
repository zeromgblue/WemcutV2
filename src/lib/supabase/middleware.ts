import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_UNAVAILABLE, fetchWithTimeout, withAuthTimeout } from "./timeout";

const PROTECTED_PATHS = ["/dashboard", "/editor"];
const AUTH_PATHS = ["/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token if needed — do not add logic between
  // createServerClient and getClaims(), it can break session refresh.
  // getClaims() verifies the JWT locally when the project uses asymmetric
  // signing keys, so most requests skip the round trip to the Auth server.
  const result = await withAuthTimeout(() => supabase.auth.getClaims());
  const authUnavailable =
    result === "timeout" || result.error?.name === "AuthRetryableFetchError";
  const user = result === "timeout" ? null : (result.data?.claims ?? null);

  const { pathname } = request.nextUrl;
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // Supabase didn't answer in time: we can't tell who this is. Keep the login
  // page reachable and send protected pages there with a clear message,
  // rather than leaving the request hanging.
  if (authUnavailable) {
    if (!isProtectedPath) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", AUTH_UNAVAILABLE);
    return NextResponse.redirect(url);
  }

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
