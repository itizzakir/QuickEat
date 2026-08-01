"use client";

import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { normalizeRole } from "../utils/roles";
import NotAuthorized from "./NotAuthorized";
import FullPageSpinner from "./FullPageSpinner";

/**
 * Route guard.
 *
 * Takes `roles` as an array and normalises the ROLE_ prefix on both sides. An authenticated
 * user with the wrong role gets an explicit "Not authorised" page rather than a silent
 * redirect home — the old behaviour was indistinguishable from a broken link.
 *
 * This is a usability layer, not a security boundary: the server authorises every request
 * independently, so tampering with the stored role changes what is rendered and nothing else.
 */
export default function ProtectedRoute({ children, roles, role }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner label="Checking your session..." />;
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  const allowed = (roles ?? (role ? [role] : [])).map(normalizeRole).filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(normalizeRole(user.role))) {
    return <NotAuthorized requiredRoles={allowed} />;
  }

  return children;
}
