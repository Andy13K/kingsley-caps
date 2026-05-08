import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import VendorLayout from './components/layout/VendorLayout';
import Spinner from './components/ui/Spinner';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Checkout from './pages/Checkout';
import CryptoCheckout from './pages/CryptoCheckout';
import OrderConfirmation from './pages/OrderConfirmation';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorInventory from './pages/vendor/Inventory';
import VendorOrders from './pages/vendor/Orders';
import VendorSettings from './pages/vendor/Settings';
import SuperAdmin from './pages/admin/SuperAdmin';

function LoadingScreen() {
  return (
    <div className="flex justify-center items-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function VendorRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['vendor', 'staff', 'superadmin'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Vendor panel — propio layout sin Navbar/Footer */}
      <Route
        path="/vendor"
        element={<VendorRoute><VendorLayout /></VendorRoute>}
      >
        <Route index element={<Navigate to="/vendor/dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="inventory" element={<VendorInventory />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="settings" element={<VendorSettings />} />
      </Route>

      {/* SuperAdmin panel — sin Navbar/Footer */}
      <Route
        path="/admin/dashboard"
        element={<AdminRoute><SuperAdmin /></AdminRoute>}
      />

      {/* Public layout con Navbar + Footer */}
      <Route
        path="/*"
        element={
          <div className="min-h-[100dvh] flex flex-col bg-cream dark:bg-charcoal-950 text-charcoal-950 dark:text-zinc-50 transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/checkout/crypto" element={<ProtectedRoute><CryptoCheckout /></ProtectedRoute>} />
                <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}
