"use client"

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { adminApi, apiErrorMessage } from "../services/api"
import { formatCurrencyCompact, formatCount } from "../utils/currency"
import { Shield, Users, Store, Truck, DollarSign, LogOut, BarChart3, Settings, Package, UserPlus, Loader2, Menu as MenuIcon, X } from "lucide-react"
import UserManagement from "../components/UserManagement"
import AdminCreationPanel from "../components/AdminCreationPanel"
import RestaurantManagement from "../components/RestaurantManagement"
import DeliveryPartnerManagement from "../components/DeliveryManagement"
import SystemSettings from "../components/AdminSettings"

const TABS = ["overview", "users", "create-admin", "restaurants", "deliveries", "settings"];

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  // Tab state lives in the URL so the back button and deep links work.
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = TABS.find((t) => location.pathname.endsWith("/" + t)) || "overview"
  const setActiveTab = (tab) => navigate("/admin-dashboard/" + tab)

  // Real platform totals. These cards used to render hardcoded numbers
  // (1,234 users / 156 restaurants / $45,678 revenue / 4.6 rating / 342 orders).
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState("")
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true)
    setStatsError("")
    try {
      setStats(await adminApi.stats())
    } catch (err) {
      setStatsError(apiErrorMessage(err, "Could not load platform stats"))
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // Rupees everywhere; the admin overview used to be the one screen showing $.
  const money = formatCurrencyCompact
  const count = formatCount

  const sidebarItems = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "users", name: "User Management", icon: Users },
    { id: "create-admin", name: "Create Admin", icon: UserPlus }, 
    { id: "restaurants", name: "Restaurants", icon: Store },
    { id: "deliveries", name: "Delivery Partners", icon: Truck },
    { id: "settings", name: "Settings", icon: Settings },
  ]

  const renderActiveTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold">Today&apos;s Orders</h3>
              <p className="text-2xl font-bold text-blue-600">{isLoadingStats ? "—" : count(stats?.ordersToday)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">Today&apos;s Revenue</h3>
              <p className="text-2xl font-bold text-green-600">{isLoadingStats ? "—" : money(stats?.revenueToday)}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <BarChart3 className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold">Avg. Rating</h3>
              <p className="text-2xl font-bold text-yellow-600">{isLoadingStats ? "—" : (stats?.averageRating ?? 0).toFixed(1)}</p>
            </div>
          </div>
        );
      case 'users':
        return <UserManagement />;
      case 'create-admin':
        return <AdminCreationPanel />;
      case 'restaurants':
        return <RestaurantManagement />;
      case 'deliveries':
        return <DeliveryPartnerManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <div>Select a tab</div>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2">
                <MenuIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">QuickBite Management Panel</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img src={user?.avatarUrl || "/images/avatars/admin.svg"} alt={user?.name || 'Admin'} className="h-8 w-8 rounded-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/avatars/admin.svg"; }} />
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards — every figure comes from GET /api/admin/stats */}
        {statsError && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md flex items-center justify-between">
            <span>{statsError}</span>
            <button onClick={loadStats} className="underline font-medium">Retry</button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : count(stats?.totalUsers)}
                </p>
                <p className="text-xs text-gray-500">{count(stats?.totalCustomers)} customers</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Restaurants</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : count(stats?.totalRestaurants)}
                </p>
                <p className="text-xs text-gray-500">{count(stats?.pendingRestaurants)} awaiting approval</p>
              </div>
              <Store className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Partners</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : count(stats?.totalDeliveryPartners)}
                </p>
                <p className="text-xs text-gray-500">{count(stats?.totalOrders)} orders all time</p>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : money(stats?.revenueToday)}
                </p>
                <p className="text-xs text-gray-500">{count(stats?.ordersToday)} orders today</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Sidebar — a drawer below lg, static above */}
          {isSidebarOpen && (
            <div onClick={() => setIsSidebarOpen(false)} aria-hidden="true" className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
          )}
          <div className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-64 bg-white lg:bg-transparent p-4 lg:p-0 z-50 lg:z-auto transform transition-transform lg:transform-none overflow-y-auto ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} lg:w-64 flex-shrink-0`}>
            <div className="flex justify-end lg:hidden mb-2">
              <button onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" className="p-2"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <nav className="card p-4">
              <ul className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false) }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                          activeTab === item.id ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6">
                {sidebarItems.find(item => item.id === activeTab)?.name}
              </h2>
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
