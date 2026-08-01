import { vi } from "vitest";

/** Builds a syntactically valid JWT with a chosen exp. Signature is irrelevant client-side. */
export function makeToken({ expiresInSeconds = 3600, sub = "user@test.dev" } = {}) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  return `${header}.${payload}.not-a-real-signature`;
}

export const SESSION_KEY = "quickbite_user_session_v2";

export function readStoredSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Shape the server returns from /api/auth/me. */
export function serverUser(overrides = {}) {
  return {
    id: 1,
    fullName: "Test User",
    email: "user@test.dev",
    role: "ROLE_CUSTOMER",
    mobile: "+91 90000 00000",
    avatarUrl: null,
    address: "",
    enabled: true,
    ...overrides,
  };
}

/** Silences the router's v7 future-flag warnings so real failures stand out. */
export function silenceRouterWarnings() {
  const warn = console.warn;
  vi.spyOn(console, "warn").mockImplementation((...args) => {
    if (typeof args[0] === "string" && args[0].includes("React Router Future Flag")) return;
    warn(...args);
  });
}
