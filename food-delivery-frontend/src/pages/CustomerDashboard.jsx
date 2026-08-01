import { useState, useMemo, useEffect, useCallback } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { mockApi } from "../services/mockApi";
import { api } from "../services/api";
import {
  Search,
  ShoppingCart,
  User,
  Package,
  LogOut,
  Menu,
  Heart,
} from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Data state
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedRestaurantMenu, setSelectedRestaurantMenu] = useState([]);
  const [cart, setCart] = useState(null); 
  const [orders, setOrders] = useState([]);

  // UI/Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- DATA FETCHING ---
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Use api for fetching restaurants, mockApi for others
      const restaurants = await api.getRestaurants();
      // Fetch real cart
      const cartData = await api.getCart(user.id);
      const ordersData = await api.getOrders(user?.id);

      setAllRestaurants(restaurants);
      setCart(cartData);
      setOrders(ordersData);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const handleRestaurantClick = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsMenuLoading(true);
    try {
      // Fetch specific restaurant details which includes menu from backend
      const restaurantDetail = await api.getRestaurantById(restaurant.id);
      setSelectedRestaurantMenu(restaurantDetail?.menu || []);
    } catch (err) {
      alert(`Error fetching menu: ${err.message}`);
      setSelectedRestaurant(null);
    } finally {
      setIsMenuLoading(false);
    }
  };

  // --- CART & ORDER HANDLERS ---
   const addToCart = async (menuItem) => {
    try {
      const updatedCart = await api.addToCart(user.id, menuItem, 1);
      setCart(updatedCart);
    } catch (err) {
      alert(`Error adding to cart: ${err.message}`);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const updatedCart = await api.removeFromCart(cartItemId);
      setCart(updatedCart); 
    } catch (err) {
      alert(`Error removing from cart: ${err.message}`);
    }
  };

  const handleOrderPlacement = async () => {
    try {
      // Refresh orders from backend
      const updatedOrders = await api.getOrders(user.id);
      setOrders(updatedOrders);
      
      // Refresh cart (it should be empty now as Cart.jsx cleared it)
      const emptyCart = await api.getCart(user.id);
      setCart(emptyCart);
      
      return true; 
    } catch (err) {
      alert(`Error refreshing data: ${err.message}`);
      return false; 
    }
  };

  const getTotalItems = () =>
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;


  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center font-semibold">
        Loading Dashboard...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 p-4 text-center">
        Error: {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2"
            >
              <Menu />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">
              Quick<span className="text-primary-500">Bite</span>
            </h1>
            <div className="flex items-center space-x-4">
              <NavLink
                to="/customer-dashboard/cart"
                className="relative p-2"
              >
                <ShoppingCart />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </NavLink>
              <div className="hidden sm:flex items-center space-x-3">
                <img
                  src={
                    user.avatarUrl || `https://i.pravatar.cc/40?u=${user.name}`
                  }
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
                <p className="text-sm font-medium">{user.name}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600"
              >
                <LogOut />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
          )}
          <aside
            className={`fixed lg:relative top-0 left-0 h-full w-64 bg-white shadow-lg lg:shadow-none z-40 transform transition-transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0`}
          >
            <nav className="p-4">
              <ul className="space-y-2">
                {[
                  { id: "browse", name: "Browse", icon: Search, path: "/customer-dashboard" },
                  { id: "wishlist", name: "Wishlist", icon: Heart, path: "/customer-dashboard/wishlist" },
                  { id: "orders", name: "My Orders", icon: Package, path: "/customer-dashboard/orders" },
                  { id: "cart", name: "Cart", icon: ShoppingCart, path: "/customer-dashboard/cart" },
                  { id: "profile", name: "Profile", icon: User, path: "/customer-dashboard/profile" },
                ].map((item) => {
                  const Icon = item.icon;
                  // Handle exact match for root path, partial for others
                  const isExact = item.path === "/customer-dashboard";
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.path}
                        end={isExact}
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${
                          isActive
                            ? "bg-primary-50 text-primary-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Icon />
                        <span>{item.name}</span>
                        {item.id === "cart" && getTotalItems() > 0 && (
                          <span className="ml-auto bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {getTotalItems()}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
             <Outlet context={{ 
                user,
                allRestaurants, 
                searchQuery, 
                setSearchQuery, 
                handleRestaurantClick, 
                addToCart, 
                selectedRestaurant, 
                setSelectedRestaurant, 
                selectedRestaurantMenu, 
                isMenuLoading, 
                cart, 
                removeFromCart, 
                handleOrderPlacement,
                orders 
             }} />
          </main>
        </div>
      </div>
    </div>
  );
}
