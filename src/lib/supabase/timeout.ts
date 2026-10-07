// Guards against Supabase being slow or unreachable (paused project, outage,
// DNS failure). Without these, auth-js keeps retrying a failed token refresh
// for ~30s and every request that carries a session cookie hangs with it.

export const AUTH_TIMEOUT_MS = 4000;
const FETCH_TIMEOUT_MS = 10000;

// Error code passed to /login?error= when the auth service can't be reached.
export const AUTH_UNAVAILABLE = "auth-unavailable";

// fetch for the Supabase clients: gives up on a single request after 10s.
export const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

// After a timeout, skip auth calls for a short while so that every request
// during an outage doesn't wait the full AUTH_TIMEOUT_MS again.
const COOLDOWN_MS = 15000;
let authDownUntil = 0;

// Resolves to "timeout" if the auth call fails outright or hasn't settled
// within AUTH_TIMEOUT_MS. `call` is not invoked at all during the cooldown.
export async function withAuthTimeout<T>(call: () => Promise<T>): Promise<T | "timeout"> {
  if (Date.now() < authDownUntil) return "timeout";

  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), AUTH_TIMEOUT_MS);
  });
  const result = await Promise.race([call().catch(() => "timeout" as const), timeout]).finally(
    () => clearTimeout(timer)
  );

  if (result === "timeout") authDownUntil = Date.now() + COOLDOWN_MS;
  return result;
}
