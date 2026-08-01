"use client"

import { useAuth } from "../contexts/AuthContext"
import LandingPage from "../pages/LandingPage"
import CustomerDashboard from "../pages/CustomerDashboard"
import RestaurantDashboard from "../pages/RestaurantDashboard"
import DeliveryDashboard from "../pages/DeliveryDashboard"
import AdminDashboard from "../pages/AdminDashboard"

export default function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // If user is not authenticated, show the landing page
  if (!user) {
    return <LandingPage />
  }

  // --- THE FIX ---
  // Get the role and convert to lowercase for a reliable check, stripping 'role_' if present
  const userRole = user.role ? user.role.toLowerCase().replace('role_', '') : '';

  // Role-based dashboard rendering
  switch (userRole) {
    case "customer":
      return <CustomerDashboard />
    case "restaurant":
      return <RestaurantDashboard />
    case "deliveryman":
    case "delivery_partner":
    case "delivery":
      return <DeliveryDashboard />
    case "admin":
      return <AdminDashboard />
    default:
      // It's better to redirect to login or show an error for unknown roles
      console.error("Unknown or missing user role:", user.role);
      return <LandingPage /> // Or a dedicated error page
  }
}