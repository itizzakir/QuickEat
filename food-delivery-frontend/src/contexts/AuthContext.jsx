"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { authService } from "../services/authService";
import { api, setSessionExpiredHandler } from "../services/api";
import { clearSession, readSession, writeSession } from "../services/session";
import { isTokenExpired, millisUntilExpiry } from "../utils/jwt";
import { dashboardPathFor, normalizeUser } from "../utils/roles";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const stored = readSession();
    // Rendered optimistically so a refresh does not flash the landing page, but treated as
    // unverified until GET /api/auth/me confirms it below.
    return stored ? normalizeUser(stored, { token: stored.token }) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const expiryTimer = useRef(null);
  // Guards against a burst of failed requests firing several logout toasts at once.
  const loggingOut = useRef(false);

  const persist = useCallback((next) => {
    setUser(next);
    writeSession(next);
  }, []);

  const endSession = useCallback(
    (message) => {
      if (loggingOut.current) return;
      loggingOut.current = true;

      clearSession();
      setUser(null);
      if (message) toast.error(message);
      navigate("/", { replace: true });

      // Allow the next genuine expiry to notify again.
      setTimeout(() => {
        loggingOut.current = false;
      }, 1000);
    },
    [navigate]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

  // The axios response interceptor lives outside React; this wires it to our state.
  useEffect(() => {
    setSessionExpiredHandler(endSession);
    return () => setSessionExpiredHandler(null);
  }, [endSession]);

  /**
   * Revalidate the stored session against the server on every app load.
   *
   * This is what makes localStorage tampering pointless: whatever role is sitting in the blob,
   * the user object the app actually renders comes from /api/auth/me, signed by the server.
   */
  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      const stored = readSession();

      if (!stored?.token) {
        clearSession();
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (isTokenExpired(stored.token)) {
        clearSession();
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const me = await api.getMe();
        if (cancelled) return;
        persist(normalizeUser(me, { token: stored.token }));
      } catch {
        if (cancelled) return;
        // Any failure here means the token is not usable — drop it rather than trusting the blob.
        clearSession();
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    validate();
    return () => {
      cancelled = true;
    };
    // Runs once on mount; `persist` is stable.
  }, [persist]);

  // Pre-emptive logout the moment the token's own exp passes, without waiting for a 401.
  useEffect(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
    if (!user?.token) return undefined;

    const remaining = millisUntilExpiry(user.token);
    if (remaining === null) return undefined;

    if (remaining <= 0) {
      endSession("Your session has expired. Please sign in again.");
      return undefined;
    }

    // setTimeout saturates above ~24.8 days; our tokens are far shorter, but clamp anyway.
    expiryTimer.current = setTimeout(
      () => endSession("Your session has expired. Please sign in again."),
      Math.min(remaining, 2147483647)
    );

    return () => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
  }, [user?.token, endSession]);

  const login = useCallback(
    async (email, password) => {
      const data = await authService.login(email, password);
      const normalized = normalizeUser(data, { token: data.token });
      persist(normalized);
      return normalized;
    },
    [persist]
  );

  const register = useCallback(async (userData) => authService.register(userData), []);

  const updateUser = useCallback(
    (patch) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = normalizeUser({ ...prev, ...patch }, { token: prev.token });
        writeSession(next);
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      authToken: user?.token || null,
      isAuthenticated: Boolean(user?.token),
      role: user?.role || "",
      dashboardPath: dashboardPathFor(user?.role),
    }),
    [user, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// The provider and its hook live together by design; this only costs HMR granularity.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
