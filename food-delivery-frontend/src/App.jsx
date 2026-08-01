import { useEffect } from 'react';
import { Routes, Route, useOutletContext, useNavigate } from 'react-router-dom';
import { AuthProvider } from "./contexts/AuthContext";
import { OrderProvider } from './contexts/OrderProvider';
import { WishlistProvider } from './contexts/WishlistContext';
import { initializeMockData } from './services/mockApi';

// Pages & Components
import LandingPage from "./pages/LandingPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BrowseRestaurants from "./components/BrowseRestaurants";
import Wishlist from "./components/Wishlist";
import MyOrders from "./components/MyOrders";
import Cart from "./components/Cart";
import Profile from "./components/Profile";

// --- Route Wrappers to connect Context to Props ---

const BrowseWrapper = () => {
  const context = useOutletContext();
  return <BrowseRestaurants {...context} />;
};

const CartWrapper = () => {
  const context = useOutletContext();
  const navigate = useNavigate();
  return (
    <Cart 
      cart={context.cart} 
      onAddToCart={context.addToCart} 
      onRemoveFromCart={context.removeFromCart}
      onBrowse={() => navigate('/customer-dashboard')}
      onOrderSuccess={context.handleOrderPlacement}
    />
  );
};

const WishlistWrapper = () => {
  const context = useOutletContext();
  return <Wishlist onRestaurantClick={context.handleRestaurantClick} />;
};

const OrdersWrapper = () => {
  const context = useOutletContext();
  return <MyOrders initialOrders={context.orders} />;
};

const ProfileWrapper = () => {
  return <Profile />;
};


function App() {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <AuthProvider>
      <OrderProvider>
        <WishlistProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              <Route 
                path="/customer-dashboard" 
                element={
                  <ProtectedRoute role="CUSTOMER">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              >
                <Route index element={<BrowseWrapper />} />
                <Route path="wishlist" element={<WishlistWrapper />} />
                <Route path="orders" element={<OrdersWrapper />} />
                <Route path="cart" element={<CartWrapper />} />
                <Route path="profile" element={<ProfileWrapper />} />
              </Route>
              
              <Route 
                path="/restaurant-dashboard" 
                element={
                  <ProtectedRoute role="RESTAURANT">
                    <RestaurantDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/delivery-dashboard" 
                element={
                  <ProtectedRoute role="DELIVERY">
                    <DeliveryDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute role="ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
        </WishlistProvider>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;