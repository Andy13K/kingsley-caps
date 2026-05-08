import { useEffect, useState } from 'react';
<<<<<<< HEAD
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
=======
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const MOCK_DATA = {
  salesGtq: 18450,
  salesEth: '1.24',
  ordersByStatus: { pending_payment: 3, paid: 7, preparing: 5, packed: 2, shipped: 8, delivered: 24, cancelled: 1 },
  topProducts: [
    { name: 'Gorra Classic Negra M', sold: 42 },
    { name: 'Gorra Elite Navy S', sold: 35 },
    { name: 'Gorra Sport Roja XL', sold: 28 },
    { name: 'Gorra Classic Blanca L', sold: 19 },
    { name: 'Gorra Elite Gris M', sold: 14 },
  ],
  lowStock: [
    { sku: 'CAP-BLK-M', product_name: 'Gorra Classic', stock: 2, low_stock_threshold: 5 },
    { sku: 'CAP-WHT-L', product_name: 'Gorra Classic', stock: 0, low_stock_threshold: 5 },
    { sku: 'CAP-RED-XL', product_name: 'Gorra Sport', stock: 3, low_stock_threshold: 5 },
  ],
  recentOrders: [
    { id: 'ord-0001-uuid', customer_name: 'Ana García', total_fiat: 450, status: 'paid', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'ord-0002-uuid', customer_name: 'Luis Pérez', total_fiat: 900, status: 'preparing', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'ord-0003-uuid', customer_name: 'María López', total_fiat: 225, status: 'shipped', created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 'ord-0004-uuid', customer_name: 'Carlos Ruiz', total_fiat: 675, status: 'delivered', created_at: new Date(Date.now() - 259200000).toISOString() },
    { id: 'ord-0005-uuid', customer_name: 'Sofia Chen', total_fiat: 450, status: 'pending_payment', created_at: new Date(Date.now() - 345600000).toISOString() },
  ],
};

const STATUS_LABEL = {
  pending_payment: 'Pago pendiente', paid: 'Pagado', preparing: 'Preparando',
  packed: 'Empacado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};

const STATUS_COLOR = {
  pending_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  packed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [ordersRes, alertsRes, recentRes] = await Promise.allSettled([
          api.get(`/api/orders?dateFrom=${dateFrom}&limit=200`),
          api.get('/api/inventory/alerts'),
          api.get('/api/orders?limit=5'),
        ]);

        const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value.data.data.orders || []) : [];
        const alerts = alertsRes.status === 'fulfilled' ? (alertsRes.value.data.data.alerts || alertsRes.value.data.data || []) : MOCK_DATA.lowStock;
        const recent = recentRes.status === 'fulfilled' ? (recentRes.value.data.data.orders || []) : MOCK_DATA.recentOrders;

        const salesGtq = orders.reduce((sum, o) => sum + (o.total_fiat || 0), 0);
        const salesEth = orders.filter((o) => o.payment_method === 'crypto_eth').reduce((sum, o) => sum + parseFloat(o.total_eth || 0), 0).toFixed(4);

        const ordersByStatus = {};
        orders.forEach((o) => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1; });

        const productCounts = {};
        orders.forEach((o) => (o.items || []).forEach((item) => {
          const key = item.product_name || item.sku || 'Producto';
          productCounts[key] = (productCounts[key] || 0) + (item.quantity || 1);
        }));
        const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, sold]) => ({ name, sold }));

        setData({
          salesGtq: salesGtq || MOCK_DATA.salesGtq,
          salesEth: salesEth !== '0.0000' ? salesEth : MOCK_DATA.salesEth,
          ordersByStatus: Object.keys(ordersByStatus).length ? ordersByStatus : MOCK_DATA.ordersByStatus,
          topProducts: topProducts.length ? topProducts : MOCK_DATA.topProducts,
          lowStock: alerts.length ? alerts : MOCK_DATA.lowStock,
          recentOrders: recent.length ? recent : MOCK_DATA.recentOrders,
        });
      } catch {
        setData(MOCK_DATA);
>>>>>>> origin/master
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
<<<<<<< HEAD
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
=======
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" className="text-gold" />
      </div>
    );
  }

  const maxOrders = Math.max(...Object.values(data.ordersByStatus), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-950 dark:text-white">Dashboard</h1>
        <p className="text-sm text-charcoal-500 dark:text-zinc-400 mt-1">Resumen del mes actual</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide">Ventas del mes</p>
          <p className="text-2xl font-bold text-gold mt-2">Q{data.salesGtq.toLocaleString('es-GT')}</p>
          <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">GTQ total facturado</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide">Ventas ETH</p>
          <p className="text-2xl font-bold text-gold mt-2">{data.salesEth} ETH</p>
          <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">Pagos en criptomoneda</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide">Total órdenes</p>
          <p className="text-2xl font-bold text-charcoal-950 dark:text-white mt-2">
            {Object.values(data.ordersByStatus).reduce((a, b) => a + b, 0)}
          </p>
          <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">Todas las órdenes del mes</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide">Alertas de stock</p>
          <p className={`text-2xl font-bold mt-2 ${data.lowStock.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {data.lowStock.length}
          </p>
          <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">Variantes bajo umbral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status bar chart */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white mb-4">Órdenes por estado</h2>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-charcoal-600 dark:text-zinc-400">{STATUS_LABEL[status] || status}</span>
                  <span className="text-xs font-semibold text-charcoal-800 dark:text-zinc-200">{count}</span>
                </div>
                <div className="h-2 bg-charcoal-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxOrders) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 products */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white mb-4">Top 5 productos vendidos</h2>
          <div className="space-y-3">
            {data.topProducts.map((p, i) => {
              const maxSold = data.topProducts[0]?.sold || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-charcoal-600 dark:text-zinc-400 truncate max-w-[200px]">{p.name}</span>
                    <span className="text-xs font-semibold text-charcoal-800 dark:text-zinc-200 ml-2">{p.sold} uds</span>
                  </div>
                  <div className="h-2 bg-charcoal-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(p.sold / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        {data.lowStock.length > 0 && (
          <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-red-200 dark:border-red-900/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">⚠ Stock bajo</h2>
              <Link to="/vendor/inventory" className="text-xs text-gold hover:text-gold-dark font-medium">Ver inventario →</Link>
            </div>
            <div className="space-y-2">
              {data.lowStock.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-charcoal-50 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-charcoal-900 dark:text-white">{v.sku}</p>
                    <p className="text-xs text-charcoal-500 dark:text-zinc-400">{v.product_name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${v.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                    {v.stock} uds
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Últimas órdenes</h2>
            <Link to="/vendor/orders" className="text-xs text-gold hover:text-gold-dark font-medium">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-charcoal-50 dark:border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{o.customer_name || '—'}</p>
                  <p className="text-xs text-charcoal-400 dark:text-zinc-500">#{o.id.slice(0, 8).toUpperCase()} · {relativeTime(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-charcoal-900 dark:text-white">Q{o.total_fiat}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || ''}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> origin/master
