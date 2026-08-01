"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { apiErrorMessage, deliveryApi } from "../services/api";
import {
  DELIVERY_NEXT_ACTIONS,
  getStatusClasses,
  getStatusLabel,
} from "../constants/orderStatus";
import { formatCurrency } from "../utils/currency";
import {
  Truck,
  DollarSign,
  Package,
  LogOut,
  ToggleLeft,
  ToggleRight,
  User,
  Loader2,
  Save,
} from "lucide-react";

const TABS = ["available", "active", "earnings", "profile"];

const EMPTY_PROFILE = {
  vehicleType: "MOTORCYCLE",
  vehicleModel: "",
  licenseNumber: "",
  vehicleRegistrationNumber: "",
  deliveryZone: "",
  idProofUrl: "",
};

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  // Tab state lives in the URL so the back button and deep links work.
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = TABS.find((t) => location.pathname.endsWith("/" + t)) || "available";
  const setActiveTab = (tab) => navigate("/delivery-dashboard/" + tab);

  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);

  const [isAvailable, setIsAvailable] = useState(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [available, mine, earningsData, profileData] = await Promise.all([
        deliveryApi.available(),
        deliveryApi.myDeliveries(),
        deliveryApi.earnings(),
        deliveryApi.profile(),
      ]);

      setAvailableDeliveries(available);
      setActiveDeliveries(mine.active || []);
      setCompletedDeliveries(mine.completed || []);
      setEarnings(earningsData);
      setProfile(profileData);
      setProfileForm({
        ...EMPTY_PROFILE,
        ...profileData,
        vehicleType: profileData.vehicleType || "MOTORCYCLE",
      });
      setIsAvailable(profileData.available !== false);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load your deliveries"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleToggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      // Persisted server-side; this used to flip local state only and reset on refresh.
      const saved = await deliveryApi.setAvailability(!isAvailable);
      setIsAvailable(saved.available !== false);
      toast.success(saved.available !== false ? "You are online" : "You are offline");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not change your availability"));
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const acceptDelivery = async (orderId) => {
    setBusyOrderId(orderId);
    try {
      const claimed = await deliveryApi.accept(orderId);
      setAvailableDeliveries((prev) => prev.filter((o) => o.id !== orderId));
      setActiveDeliveries((prev) => [claimed, ...prev]);
      toast.success(`Order #${orderId} is yours`);
      setActiveTab("active");
    } catch (err) {
      // 409 means another partner won the race; refresh so the board is honest.
      toast.error(apiErrorMessage(err, "Could not accept that delivery"));
      if (err?.response?.status === 409) fetchData();
    } finally {
      setBusyOrderId(null);
    }
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    setBusyOrderId(orderId);
    try {
      const updated = await deliveryApi.updateStatus(orderId, newStatus);
      if (updated.status === "DELIVERED") {
        setActiveDeliveries((prev) => prev.filter((o) => o.id !== orderId));
        setCompletedDeliveries((prev) => [updated, ...prev]);
        // Earnings only move when a delivery completes.
        deliveryApi.earnings().then(setEarnings).catch(() => {});
      } else {
        setActiveDeliveries((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
      toast.success(`Order #${orderId} → ${getStatusLabel(updated.status)}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update the delivery"));
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const saved = await deliveryApi.saveProfile({
        vehicleType: profileForm.vehicleType,
        vehicleModel: profileForm.vehicleModel,
        licenseNumber: profileForm.licenseNumber,
        vehicleRegistrationNumber: profileForm.vehicleRegistrationNumber,
        deliveryZone: profileForm.deliveryZone,
        idProofUrl: profileForm.idProofUrl,
      });
      setProfile(saved);
      setProfileForm({ ...EMPTY_PROFILE, ...saved });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save your profile"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const DeliveryCard = ({ delivery, children }) => (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">Order #{delivery.id}</h3>
          <p className="text-gray-600 text-sm">{delivery.restaurant?.name || "Restaurant"}</p>
          {delivery.deliveryAddress && (
            <p className="text-xs text-gray-500 mt-1">To: {delivery.deliveryAddress}</p>
          )}
          <p className="text-xs text-gray-500">
            {delivery.items?.length || 0} item(s) · order {formatCurrency(delivery.totalAmount)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">{formatCurrency(delivery.deliveryFee)}</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(delivery.status)}`}>
            {getStatusLabel(delivery.status)}
          </span>
        </div>
      </div>
      {children}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600 p-4 text-center">
        <h2 className="text-xl font-semibold">An Error Occurred</h2>
        <p className="mt-2">{error}</p>
        <div className="flex gap-3 mt-4">
          <button onClick={fetchData} className="bg-orange-500 text-white px-4 py-2 rounded-lg">Try again</button>
          <button onClick={logout} className="border px-4 py-2 rounded-lg">Log In Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Truck className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold">Delivery Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Available</span>
              <button
                onClick={handleToggleAvailability}
                disabled={isTogglingAvailability}
                className={`p-1 rounded-full disabled:opacity-50 ${isAvailable ? "text-green-500" : "text-gray-400"}`}
              >
                {isTogglingAvailability
                  ? <Loader2 className="h-6 w-6 animate-spin" />
                  : (isAvailable ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />)}
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <img src={user?.avatarUrl || "/images/avatars/delivery.svg"} alt={user?.name} className="h-8 w-8 rounded-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/avatars/delivery.svg"; }}/>
              <div className="hidden md:block text-right"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-gray-500">Delivery Partner</p></div>
              <button onClick={logout} aria-label="Log out" className="p-2 text-gray-600 hover:text-red-600"><LogOut className="h-5 w-5" aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats straight from GET /api/delivery/earnings — these were hardcoded at ₹50 per
            delivery and a fictional distance figure. */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Today&apos;s Deliveries</p><p className="text-2xl font-bold">{earnings?.deliveriesToday ?? 0}</p></div>
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Earnings Today</p><p className="text-2xl font-bold">{formatCurrency(earnings?.earningsToday)}</p></div>
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">This Week</p><p className="text-2xl font-bold">{earnings?.deliveriesThisWeek ?? 0}</p></div>
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Earnings This Week</p><p className="text-2xl font-bold">{formatCurrency(earnings?.earningsThisWeek)}</p></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow border p-4">
              <ul className="space-y-2">
                {[
                  { id: "available", name: "Available Orders", icon: Package },
                  { id: "active", name: "Active Deliveries", icon: Truck },
                  { id: "earnings", name: "Earnings", icon: DollarSign },
                  { id: "profile", name: "Profile", icon: User },
                ].map((item) => <li key={item.id}><button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${activeTab === item.id ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-gray-50"}`}><item.icon className="h-5 w-5" /><span className="font-medium">{item.name}</span></button></li>)}
              </ul>
            </nav>
          </aside>

          <div className="flex-1">
            {activeTab === "available" && (
                <div className="bg-white rounded-xl shadow border p-4">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Available Orders</h2><div className={`px-3 py-1 rounded-full text-sm font-medium ${isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{isAvailable ? "Online" : "Offline"}</div></div>
                    {!isAvailable ? (
                        <div className="text-center py-12"><Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold">You&apos;re currently offline</h3><p className="text-gray-600 mb-4">Turn on availability to see new delivery requests.</p><button onClick={handleToggleAvailability} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg">Go Online</button></div>
                    ) : (
                        <div className="space-y-4">
                            {availableDeliveries.length > 0 ? availableDeliveries.map((delivery) => (
                                <DeliveryCard key={delivery.id} delivery={delivery}>
                                    <button
                                      onClick={() => acceptDelivery(delivery.id)}
                                      disabled={busyOrderId === delivery.id}
                                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg flex items-center justify-center disabled:opacity-60"
                                    >
                                      {busyOrderId === delivery.id ? <Loader2 className="animate-spin h-5 w-5" /> : "Accept Delivery"}
                                    </button>
                                </DeliveryCard>
                            )) : <div className="text-center py-12"><Package className="h-16 w-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold">No orders available</h3><p className="text-gray-600">Orders appear here once a restaurant marks them ready for pickup.</p></div>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "active" && (
                <div className="bg-white rounded-xl shadow border p-4">
                    <h2 className="text-2xl font-bold mb-4">Active Deliveries</h2>
                    {activeDeliveries.length > 0 ? activeDeliveries.map((delivery) => (
                        <DeliveryCard key={delivery.id} delivery={delivery}>
                            <div className="flex space-x-3">
                                {/* Only the transitions the backend will accept for this state. */}
                                {(DELIVERY_NEXT_ACTIONS[delivery.status] || []).map((action) => (
                                    <button
                                        key={action.next}
                                        onClick={() => updateDeliveryStatus(delivery.id, action.next)}
                                        disabled={busyOrderId === delivery.id}
                                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center disabled:opacity-60"
                                    >
                                        {busyOrderId === delivery.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </DeliveryCard>
                    )) : <div className="text-center py-12"><Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold">No active deliveries</h3><p className="text-gray-600">Accepted deliveries will appear here.</p></div>}
                </div>
            )}

            {activeTab === "earnings" && (
              <div className="bg-white rounded-xl shadow border p-4">
                <h2 className="text-2xl font-bold mb-1">Earnings</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Paid per delivery from each order&apos;s delivery fee.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600">Today</p><p className="text-xl font-bold">{formatCurrency(earnings?.earningsToday)}</p><p className="text-xs text-gray-500">{earnings?.deliveriesToday ?? 0} deliveries</p></div>
                  <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600">This week</p><p className="text-xl font-bold">{formatCurrency(earnings?.earningsThisWeek)}</p><p className="text-xs text-gray-500">{earnings?.deliveriesThisWeek ?? 0} deliveries</p></div>
                </div>

                <h3 className="font-semibold mb-3">Completed deliveries</h3>
                <div className="space-y-4">
                  {completedDeliveries.length > 0 ? completedDeliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Order #{delivery.id}</p>
                          <p className="text-sm text-gray-500">{delivery.restaurant?.name}</p>
                          <p className="text-xs text-gray-400">{new Date(delivery.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+ {formatCurrency(delivery.deliveryFee)}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 text-center py-8">No deliveries completed yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow border p-4">
                <h2 className="text-2xl font-bold mb-4">Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img src={user?.avatarUrl || "/images/avatars/delivery.svg"} alt={user?.name} className="h-20 w-20 rounded-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/avatars/delivery.svg"; }} />
                    <div>
                      <h3 className="text-xl font-semibold">{profile?.fullName || user?.name}</h3>
                      <p className="text-gray-600">{profile?.email || user?.email}</p>
                      <p className="text-sm text-gray-500">{profile?.mobile || "No phone on file"}</p>
                    </div>
                  </div>

                  {/* Vehicle details come from the DeliveryInfo row signup writes — this used to
                      show the literal 'BIKE' from a field the user object never had. */}
                  <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium">Vehicle Type</label>
                      <select value={profileForm.vehicleType} onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value })} className="input-field mt-1" required>
                        <option value="MOTORCYCLE">Motorcycle</option>
                        <option value="SCOOTER">Scooter</option>
                        <option value="CAR">Car</option>
                        <option value="BICYCLE">Bicycle</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium">Vehicle Model</label><input type="text" value={profileForm.vehicleModel || ''} onChange={(e) => setProfileForm({ ...profileForm, vehicleModel: e.target.value })} className="input-field mt-1" required /></div>
                    <div><label className="block text-sm font-medium">License Number</label><input type="text" value={profileForm.licenseNumber || ''} onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })} className="input-field mt-1" required /></div>
                    <div><label className="block text-sm font-medium">Vehicle Registration</label><input type="text" value={profileForm.vehicleRegistrationNumber || ''} onChange={(e) => setProfileForm({ ...profileForm, vehicleRegistrationNumber: e.target.value })} className="input-field mt-1" required /></div>
                    <div><label className="block text-sm font-medium">Delivery Zone</label><input type="text" value={profileForm.deliveryZone || ''} onChange={(e) => setProfileForm({ ...profileForm, deliveryZone: e.target.value })} className="input-field mt-1" required /></div>
                    <div><label className="block text-sm font-medium">ID Proof URL</label><input type="text" value={profileForm.idProofUrl || ''} onChange={(e) => setProfileForm({ ...profileForm, idProofUrl: e.target.value })} className="input-field mt-1" /></div>
                    <div className="md:col-span-2 flex justify-end">
                      <button type="submit" disabled={isSavingProfile} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg disabled:opacity-60">
                        {isSavingProfile ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        Save profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
