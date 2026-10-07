"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTH_TIMEOUT_MS, AUTH_UNAVAILABLE } from "@/lib/supabase/timeout";

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// signInWithOAuth only builds a URL, so without this check a paused or
// unreachable Supabase project sends the user to a dead page.
async function isAuthReachable() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  }
}

export async function loginWithGoogle() {
  if (!(await isAuthReachable())) {
    redirect(`/login?error=${AUTH_UNAVAILABLE}`);
  }

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google-oauth-failed");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
