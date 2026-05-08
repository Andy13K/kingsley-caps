import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';

const StatCard = ({ label, value, hint }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    revenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.get('/products', { params: { limit: 1 } }),
          api.get('/orders', { params: { limit: 100 } }),
        ]);

        const orders = ordersRes.data.data || [];
        const revenue = orders
          .filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status))
          .reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          totalProducts: productsRes.data.meta?.total ?? 0,
          activeOrders: orders.filter((o) =>
            ['paid', 'preparing', 'packed', 'shipped'].includes(o.status)
          ).length,
          revenue,
          pendingOrders: orders.filter((o) => o.status === 'pending_payment').length,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Cargando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Resumen rapido de tu tienda</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Productos publicados" value={stats.totalProducts} />
        <StatCard label="Ordenes activas" value={stats.activeOrders} hint="paid + preparing + packed + shipped" />
        <StatCard
          label="Ingresos confirmados"
          value={formatCurrency(stats.revenue)}
          hint="ordenes pagadas, enviadas y entregadas"
        />
        <StatCard label="Pendientes de pago" value={stats.pendingOrders} />
      </div>
    </div>
  );
};

export default Dashboard;
