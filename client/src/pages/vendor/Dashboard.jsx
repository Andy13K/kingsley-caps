import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import useInventory from '../../hooks/useInventory';

const STATUS_LABEL = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  packed: 'Empacado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
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

const emptyDashboard = {
  salesGtq: 0,
  salesEth: '0.0000',
  ordersByStatus: {},
  topProducts: [],
  lowStock: [],
  recentOrders: [],
};

const rowsFrom = (response) => {
  const payload = response.value.data.data;
  return Array.isArray(payload) ? payload : payload.orders ?? payload.alerts ?? payload ?? [];
};

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { demandPredictions, isLoadingPredictions, predictionsError, fetchDemandPredictions } = useInventory();

  useEffect(() => {
    fetchDemandPredictions();
  }, [fetchDemandPredictions]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const [ordersRes, alertsRes, recentRes] = await Promise.allSettled([
          api.get(`/orders?dateFrom=${dateFrom}&limit=200`),
          api.get('/inventory/alerts'),
          api.get('/orders?limit=5'),
        ]);

        if (ordersRes.status === 'rejected' && alertsRes.status === 'rejected' && recentRes.status === 'rejected') {
          throw new Error('No se pudo cargar informacion del dashboard.');
        }

        const orders = ordersRes.status === 'fulfilled' ? rowsFrom(ordersRes) : [];
        const alerts = alertsRes.status === 'fulfilled' ? rowsFrom(alertsRes) : [];
        const recent = recentRes.status === 'fulfilled' ? rowsFrom(recentRes) : [];

        const salesGtq = orders.reduce((sum, order) => sum + Number(order.total_fiat ?? order.total ?? 0), 0);
        const salesEth = orders
          .filter((order) => (order.payment_method ?? order.paymentMethod) === 'crypto_eth')
          .reduce((sum, order) => sum + parseFloat(order.total_eth ?? 0), 0)
          .toFixed(4);

        const ordersByStatus = {};
        orders.forEach((order) => {
          ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        });

        const productCounts = {};
        orders.forEach((order) => (order.items || []).forEach((item) => {
          const key = item.product_name || item.productName || item.sku || 'Producto';
          productCounts[key] = (productCounts[key] || 0) + (item.quantity || 1);
        }));
        const topProducts = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, sold]) => ({ name, sold }));

        setData({
          salesGtq,
          salesEth,
          ordersByStatus,
          topProducts,
          lowStock: alerts,
          recentOrders: recent.map((order) => ({
            ...order,
            customer_name: order.customer_name ?? order.customer?.name ?? order.customer?.email ?? 'Cliente',
            total_fiat: Number(order.total_fiat ?? order.total ?? 0),
            created_at: order.created_at ?? order.createdAt,
          })),
        });
      } catch (err) {
        setData(emptyDashboard);
        setError(err.message || 'No se pudo cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" className="text-gold dark:text-gold-light" />
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

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Ventas del mes" value={`Q${data.salesGtq.toLocaleString('es-GT')}`} sub="GTQ total facturado" />
        <Metric label="Ventas ETH" value={`${data.salesEth} ETH`} sub="Pagos en criptomoneda" />
        <Metric label="Total ordenes" value={Object.values(data.ordersByStatus).reduce((a, b) => a + b, 0)} sub="Todas las ordenes del mes" />
        <Metric label="Alertas de stock" value={data.lowStock.length} sub="Variantes bajo umbral" danger={data.lowStock.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Ordenes por estado">
          {Object.entries(data.ordersByStatus).length === 0 && <EmptyText>Sin ordenes este mes.</EmptyText>}
          {Object.entries(data.ordersByStatus).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-charcoal-600 dark:text-zinc-400">{STATUS_LABEL[status] || status}</span>
                <span className="text-xs font-semibold text-charcoal-800 dark:text-zinc-200">{count}</span>
              </div>
              <div className="h-2 bg-charcoal-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${(count / maxOrders) * 100}%` }} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel title="Top 5 productos vendidos">
          {data.topProducts.length === 0 && <EmptyText>Sin ventas registradas.</EmptyText>}
          {data.topProducts.map((product) => {
            const maxSold = data.topProducts[0]?.sold || 1;
            return (
              <div key={product.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-charcoal-600 dark:text-zinc-400 truncate max-w-[200px]">{product.name}</span>
                  <span className="text-xs font-semibold text-charcoal-800 dark:text-zinc-200 ml-2">{product.sold} uds</span>
                </div>
                <div className="h-2 bg-charcoal-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(product.sold / maxSold) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel
          title="Stock bajo"
          action={<Link to="/vendor/inventory" className="text-xs text-gold dark:text-gold-light font-medium">Ver inventario</Link>}
          danger={data.lowStock.length > 0}
        >
          {data.lowStock.length === 0 && <EmptyText>Sin alertas de stock.</EmptyText>}
          {data.lowStock.map((variant) => (
            <div key={variant.id ?? variant.sku} className="flex items-center justify-between py-2 border-b border-charcoal-50 dark:border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-charcoal-900 dark:text-white">{variant.sku}</p>
                <p className="text-xs text-charcoal-500 dark:text-zinc-400">{variant.product_name}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${variant.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                {variant.stock} uds
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Ultimas ordenes" action={<Link to="/vendor/orders" className="text-xs text-gold dark:text-gold-light font-medium">Ver todas</Link>}>
          {data.recentOrders.length === 0 && <EmptyText>Sin ordenes recientes.</EmptyText>}
          {data.recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b border-charcoal-50 dark:border-white/5 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{order.customer_name}</p>
                <p className="text-xs text-charcoal-400 dark:text-zinc-500">#{order.id.slice(0, 8).toUpperCase()} - {relativeTime(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className="text-sm font-semibold text-charcoal-900 dark:text-white">Q{order.total_fiat}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || ''}`}>
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      <Panel
        title="Prediccion de demanda — proximos 7 dias"
        action={
          <button
            onClick={fetchDemandPredictions}
            disabled={isLoadingPredictions}
            className="text-xs text-gold dark:text-gold-light font-medium disabled:opacity-50"
          >
            Actualizar prediccion
          </button>
        }
      >
        {isLoadingPredictions && (
          <div className="flex justify-center py-4">
            <Spinner size="sm" className="text-gold dark:text-gold-light" />
          </div>
        )}
        {!isLoadingPredictions && predictionsError && (
          <EmptyText>No se pudieron cargar las predicciones.</EmptyText>
        )}
        {!isLoadingPredictions && !predictionsError && demandPredictions !== null && demandPredictions.predictions.length === 0 && (
          <EmptyText>No hay productos activos para predecir.</EmptyText>
        )}
        {!isLoadingPredictions && demandPredictions !== null && demandPredictions.predictions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-charcoal-500 dark:text-zinc-400 border-b border-charcoal-100 dark:border-white/10">
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 font-medium text-right">Uds. predichas</th>
                  <th className="pb-2 font-medium text-center">Tendencia</th>
                  <th className="pb-2 font-medium text-center">Confianza</th>
                </tr>
              </thead>
              <tbody>
                {demandPredictions.predictions.map((p) => (
                  <tr key={p.productId} className="border-b border-charcoal-50 dark:border-white/5 last:border-0">
                    <td className="py-2 pr-3 text-charcoal-900 dark:text-white font-medium truncate max-w-[160px]">{p.productName}</td>
                    <td className="py-2 pr-3 text-charcoal-500 dark:text-zinc-400">{p.category}</td>
                    <td className="py-2 text-right font-semibold text-charcoal-900 dark:text-white">{p.predictedUnits}</td>
                    <td className="py-2 text-center">
                      {p.trend === 'up' && <span className="text-green-600 font-bold">↑</span>}
                      {p.trend === 'flat' && <span className="text-gray-500 font-bold">→</span>}
                      {p.trend === 'down' && <span className="text-red-600 font-bold">↓</span>}
                    </td>
                    <td className="py-2 text-center">
                      {p.confidence === 'high' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">alta</span>}
                      {p.confidence === 'medium' && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">media</span>}
                      {p.confidence === 'low' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">baja</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Metric({ label, value, sub, danger = false }) {
  return (
    <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm">
      <p className="text-xs font-medium text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${danger ? 'text-red-500' : 'text-gold dark:text-gold-light'}`}>{value}</p>
      <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">{sub}</p>
    </div>
  );
}

function Panel({ title, action, danger = false, children }) {
  return (
    <div className={`bg-white dark:bg-charcoal-900 rounded-xl border ${danger ? 'border-red-200 dark:border-red-900/30' : 'border-charcoal-100 dark:border-white/10'} p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-semibold ${danger ? 'text-red-600 dark:text-red-400' : 'text-charcoal-950 dark:text-white'}`}>{title}</h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="text-sm text-charcoal-500 dark:text-zinc-400">{children}</p>;
}
