import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { api } from "../services/api";
import { writeSession } from "../services/session";
import { makeToken, readStoredSession, serverUser } from "./testUtils";

const ROUTES = [
  { path: "/customer-dashboard", roles: ["CUSTOMER"], label: "CUSTOMER AREA" },
  { path: "/restaurant-dashboard", roles: ["RESTAURANT"], label: "RESTAURANT AREA" },
  { path: "/delivery-dashboard", roles: ["DELIVERY"], label: "DELIVERY AREA" },
  { path: "/admin-dashboard", roles: ["ADMIN"], label: "ADMIN AREA" },
];

function App() {
  return (
    <AuthProvider>
      <Routes>
        {ROUTES.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={
              <ProtectedRoute roles={r.roles}>
                <div>{r.label}</div>
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="/" element={<div>Landing page</div>} />
      </Routes>
    </AuthProvider>
  );
}

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

/** Signs the given role in by seeding a session the server then confirms. */
function signedInAs(role) {
  writeSession({ ...serverUser({ role }), token: makeToken() });
  vi.spyOn(api, "getMe").mockResolvedValue(serverUser({ role }));
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it.each(ROUTES)("admits the matching role to $path", async ({ path, roles, label }) => {
    signedInAs(`ROLE_${roles[0]}`);
    renderAt(path);
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it.each(ROUTES)("refuses every other role on $path", async ({ path, roles, label }) => {
    const wrongRole = ROUTES.find((r) => r.roles[0] !== roles[0]).roles[0];
    signedInAs(`ROLE_${wrongRole}`);

    renderAt(path);

    expect(await screen.findByText("Not authorised")).toBeInTheDocument();
    expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  it("sends an anonymous visitor to the landing page", async () => {
    renderAt("/admin-dashboard");
    expect(await screen.findByText("Landing page")).toBeInTheDocument();
  });

  it("a tampered stored role does not grant access", async () => {
    // The attack: hand-edit the persisted blob to claim ROLE_ADMIN.
    writeSession({ ...serverUser({ role: "ROLE_ADMIN" }), token: makeToken() });
    // The server tells the truth about who this token belongs to.
    vi.spyOn(api, "getMe").mockResolvedValue(serverUser({ role: "ROLE_CUSTOMER" }));

    renderAt("/admin-dashboard");

    expect(await screen.findByText("Not authorised")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN AREA")).not.toBeInTheDocument();
    // The forged value is overwritten, so a reload cannot reuse it.
    await waitFor(() => expect(readStoredSession().role).toBe("CUSTOMER"));
  });

  it("accepts a roles array with several entries", async () => {
    signedInAs("ROLE_DELIVERY");
    render(
      <MemoryRouter initialEntries={["/shared"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/shared"
              element={
                <ProtectedRoute roles={["RESTAURANT", "DELIVERY"]}>
                  <div>SHARED AREA</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("SHARED AREA")).toBeInTheDocument();
  });

  it("normalises the ROLE_ prefix on the guard side too", async () => {
    signedInAs("ROLE_ADMIN");
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["ROLE_ADMIN"]}>
                  <div>ADMIN AREA</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("ADMIN AREA")).toBeInTheDocument();
  });
});
