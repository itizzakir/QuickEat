import { Navigate, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ConfirmProvider } from './components/ConfirmDialog';
import { WishlistProvider } from './contexts/WishlistContext';

// Pages & Components
import LandingPage from './pages/LandingPage';
import CustomerDashboard from './pages/CustomerDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import FullPageSpinner from './components/FullPageSpinner';
import NotFound from './components/NotFound';
import BrowseRestaurants from './components/BrowseRestaurants';
import Wishlist from './components/Wishlist';
import MyOrders from './components/MyOrders';
import Cart from './components/Cart';
import Profile from './components/Profile';

// --- Route wrappers that adapt the dashboard's Outlet context to component props ---

const BrowseWrapper = () => <BrowseRestaurants {...useOutletContext()} />;

const CartWrapper = () => {
  const navigate = useNavigate();
  // Cart reads everything else from CartContext; it no longer takes cart props that it
  // silently ignored while refetching its own copy.
  return <Cart onBrowse={() => navigate('/customer-dashboard')} />;
};

const WishlistWrapper = () => {
  const context = useOutletContext();
  return <Wishlist onRestaurantClick={context.handleRestaurantClick} />;
};

/**
 * "/" sends a signed-in user to their own dashboard instead of the anonymous landing page.
 */
const RootRoute = () => {
  const { isAuthenticated, isLoading, dashboardPath } = useAuth();

  if (isLoading) return <FullPageSpinner label="Checking your session..." />;
  if (isAuthenticated && dashboardPath !== '/') {
    return <Navigate to={dashboardPath} replace />;
  }
  return <LandingPage />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />

      <Route
        path="/customer-dashboard"
        element={
          <ProtectedRoute roles={['CUSTOMER']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<BrowseWrapper />} />
        <Route path="wishlist" element={<WishlistWrapper />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="cart" element={<CartWrapper />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Nested routes so the back button and deep links work; these dashboards used to
          switch panels with local `activeTab` state, which the URL never reflected. The
          panels render inside the dashboard shell, so the child routes carry no element. */}
      <Route
        path="/restaurant-dashboard"
        element={
          <ProtectedRoute roles={['RESTAURANT']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={null} />
        <Route path="menu" element={null} />
        <Route path="profile" element={null} />
      </Route>

      <Route
        path="/delivery-dashboard"
        element={
          <ProtectedRoute roles={['DELIVERY']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="available" replace />} />
        <Route path="available" element={null} />
        <Route path="active" element={null} />
        <Route path="earnings" element={null} />
        <Route path="profile" element={null} />
      </Route>

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={null} />
        <Route path="users" element={null} />
        <Route path="create-admin" element={null} />
        <Route path="restaurants" element={null} />
        <Route path="deliveries" element={null} />
        <Route path="settings" element={null} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="min-h-screen bg-gray-50">
              <Toaster position="top-right" richColors closeButton />
              <AppRoutes />
            </div>
          </WishlistProvider>
        </CartProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
