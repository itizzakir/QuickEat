import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { authService } from "../services/authService";
import { writeSession } from "../services/session";
import { makeToken, readStoredSession, serverUser } from "./testUtils";

/** Surfaces the context so assertions can read it without a real screen. */
function AuthProbe() {
  const { user, isAuthenticated, isLoading, login, logout, role, dashboardPath } = useAuth();
  return (
    <div>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="authed">{String(isAuthenticated)}</p>
      <p data-testid="name">{user?.name ?? "-"}</p>
      <p data-testid="fullName">{user?.fullName ?? "-"}</p>
      <p data-testid="role">{role || "-"}</p>
      <p data-testid="dashboard">{dashboardPath}</p>
      <button onClick={() => login("user@test.dev", "password")}>sign in</button>
      <button onClick={logout}>sign out</button>
    </div>
  );
}

const renderAuth = () =>
  render(
    <MemoryRouter initialEntries={["/start"]}>
      <AuthProvider>
        <Routes>
          <Route path="/start" element={<AuthProbe />} />
          <Route path="/" element={<p>Landing page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts anonymous when there is no stored session", async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("authed")).toHaveTextContent("false");
    expect(screen.getByTestId("dashboard")).toHaveTextContent("/");
  });

  it("login normalises fullName into name and persists the session", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      ...serverUser({ fullName: "Cara Customer" }),
      token: makeToken(),
    });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await act(async () => {
      await userEvent.click(screen.getByText("sign in"));
    });

    // The backend says fullName; components read user.name. Both must be populated.
    expect(screen.getByTestId("name")).toHaveTextContent("Cara Customer");
    expect(screen.getByTestId("fullName")).toHaveTextContent("Cara Customer");
    // ROLE_ prefix stripped, dashboard resolved from it.
    expect(screen.getByTestId("role")).toHaveTextContent("CUSTOMER");
    expect(screen.getByTestId("dashboard")).toHaveTextContent("/customer-dashboard");

    const stored = readStoredSession();
    expect(stored.name).toBe("Cara Customer");
    expect(stored.role).toBe("CUSTOMER");
  });

  it("logout clears both the context and localStorage", async () => {
    vi.spyOn(authService, "login").mockResolvedValue({
      ...serverUser(),
      token: makeToken(),
    });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await act(async () => {
      await userEvent.click(screen.getByText("sign in"));
    });
    expect(screen.getByTestId("authed")).toHaveTextContent("true");

    await act(async () => {
      await userEvent.click(screen.getByText("sign out"));
    });

    await waitFor(() => expect(localStorage.getItem("quickbite_user_session_v2")).toBeNull());
    expect(await screen.findByText("Landing page")).toBeInTheDocument();
  });

  it("revalidates a stored session against the server and adopts the server's answer", async () => {
    writeSession({ ...serverUser({ fullName: "Stale Name" }), token: makeToken() });
    const getMe = vi
      .spyOn(api, "getMe")
      .mockResolvedValue(serverUser({ fullName: "Fresh Name", role: "ROLE_ADMIN" }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("name")).toHaveTextContent("Fresh Name");
    expect(screen.getByTestId("role")).toHaveTextContent("ADMIN");
  });

  it("drops an already-expired token without calling the server, and bounces home", async () => {
    writeSession({ ...serverUser(), token: makeToken({ expiresInSeconds: -60 }) });
    const getMe = vi.spyOn(api, "getMe").mockResolvedValue(serverUser());

    renderAuth();

    // The expiry check runs before any request, so the server is never asked, and the
    // redirect means a protected screen cannot flash before the session is torn down.
    expect(await screen.findByText("Landing page")).toBeInTheDocument();
    expect(getMe).not.toHaveBeenCalled();
    await waitFor(() => expect(localStorage.getItem("quickbite_user_session_v2")).toBeNull());
  });

  it("ends the session when a token expires while the app is open", async () => {
    // shouldAdvanceTime keeps promises resolving while the clock is under our control.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      // Comfortably beyond the 30s skew allowance, so it starts out valid.
      writeSession({ ...serverUser(), token: makeToken({ expiresInSeconds: 120 }) });
      vi.spyOn(api, "getMe").mockResolvedValue(serverUser());

      renderAuth();
      await vi.waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("true"));

      // Walk past exp; the pre-emptive timer should fire without any request failing first.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(121_000);
      });

      expect(await screen.findByText("Landing page")).toBeInTheDocument();
      expect(localStorage.getItem("quickbite_user_session_v2")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops the session when the server rejects the stored token", async () => {
    writeSession({ ...serverUser(), token: makeToken() });
    vi.spyOn(api, "getMe").mockRejectedValue({ response: { status: 401 } });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("authed")).toHaveTextContent("false"));
    expect(localStorage.getItem("quickbite_user_session_v2")).toBeNull();
  });
});
