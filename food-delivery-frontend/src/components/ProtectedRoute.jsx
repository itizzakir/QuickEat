"use client"

import { useAuth } from "../contexts/AuthContext"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children, role }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Not logged in → redirect to homepage or login
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Normalize roles for comparison
  const normalizeRole = (r) => r ? r.toUpperCase().replace('ROLE_', '') : '';
  const userRole = normalizeRole(user.role);
  const requiredRole = normalizeRole(role);

  // Role mismatch → redirect to homepage
  if (role && userRole !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
