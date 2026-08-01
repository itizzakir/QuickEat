/**
 * The one place that knows where the session lives.
 *
 * Everything that needs the token goes through here, so there is a single key to change and a
 * single place that can clear it. Nothing outside this module should touch localStorage for
 * auth.
 *
 * IMPORTANT: the persisted blob is a cache, not a source of truth. A user can edit it freely in
 * devtools, so the role it contains is only ever a hint — AuthContext re-validates against
 * GET /api/auth/me on every app load, and the server authorises every request regardless.
 */

const SESSION_KEY = "quickbite_user_session_v2";

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupt JSON is the same as no session.
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function writeSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getToken() {
  return readSession()?.token || null;
}
