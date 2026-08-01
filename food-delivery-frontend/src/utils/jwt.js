/**
 * Minimal JWT reader. The payload is only used to spot an already-expired token before we
 * bother the server — it is never trusted for authorisation. The backend re-validates the
 * signature on every request.
 */

export function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    // A malformed token is treated as no token at all.
    return null;
  }
}

/** Small skew allowance so a token about to expire is not sent on a doomed request. */
const CLOCK_SKEW_SECONDS = 30;

export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") {
    // No usable exp claim: let the server decide rather than logging the user out.
    return false;
  }
  return payload.exp <= Math.floor(Date.now() / 1000) + CLOCK_SKEW_SECONDS;
}

/** Milliseconds until expiry, or null when unknown. Used to schedule a pre-emptive logout. */
export function millisUntilExpiry(token) {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000 - Date.now();
}
