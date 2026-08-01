/**
 * Role vocabulary and the canonical user shape.
 *
 * These live outside AuthContext so components can import them without pulling in the
 * provider (and so the context file exports only components + its hook).
 */

/** Strips the ROLE_ prefix and upper-cases, so "ROLE_ADMIN" and "admin" both become "ADMIN". */
export const normalizeRole = (role) =>
  role ? String(role).toUpperCase().replace(/^ROLE_/, "") : "";

export const DASHBOARD_BY_ROLE = {
  CUSTOMER: "/customer-dashboard",
  RESTAURANT: "/restaurant-dashboard",
  DELIVERY: "/delivery-dashboard",
  ADMIN: "/admin-dashboard",
};

export const dashboardPathFor = (role) => DASHBOARD_BY_ROLE[normalizeRole(role)] || "/";

/**
 * One canonical user object for the whole app.
 *
 * The backend says `fullName`; components were reading `user.name`, so every header rendered a
 * blank name and avatars fell back to `ui-avatars.com/api/?name=undefined`. Both keys are
 * populated here so the mapping exists in exactly one place.
 */
export function normalizeUser(raw, { token } = {}) {
  if (!raw) return null;
  const fullName = raw.fullName || raw.name || "";
  return {
    id: raw.id,
    name: fullName,
    fullName,
    email: raw.email || "",
    role: normalizeRole(raw.role),
    avatarUrl: raw.avatarUrl || raw.avatar || null,
    address: raw.address || "",
    mobile: raw.mobile || "",
    restaurantId: raw.restaurantId ?? null,
    token: token || raw.token || null,
  };
}
