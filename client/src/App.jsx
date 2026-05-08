import { Navigate, Route, Routes } from 'react-router-dom';
import VendorLayout from './components/layout/VendorLayout.jsx';
import Dashboard from './pages/vendor/Dashboard.jsx';
import Products from './pages/vendor/Products.jsx';
import Orders from './pages/vendor/Orders.jsx';

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/vendor/dashboard" replace />} />
    <Route path="/vendor" element={<VendorLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="products" element={<Products />} />
      <Route path="orders" element={<Orders />} />
    </Route>
    <Route
      path="*"
      element={<div className="p-8 text-center">404 — Pagina no encontrada</div>}
    />
  </Routes>
);

export default App;
