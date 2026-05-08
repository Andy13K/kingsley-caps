import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
} from '../../utils/formatters.js';

const ALL_STATUSES = [
  'pending_payment',
  'paid',
  'preparing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tracking, setTracking] = useState({ trackingNumber: '', trackingCompany: '' });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const res = await api.get('/orders', { params });
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleChangeStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Estado actualizado');
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTrackingSubmit = async (event, orderId) => {
    event.preventDefault();
    try {
      await api.put(`/orders/${orderId}/tracking`, tracking);
      toast.success('Guia registrada');
      setTracking({ trackingNumber: '', trackingCompany: '' });
      setSelectedId(null);
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ordenes</h2>
          <p className="text-sm text-gray-500">Gestiona el ciclo de vida de cada pedido</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md p-2 text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </header>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Orden</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Fecha</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium">Total</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Pago</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  Sin ordenes
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr
                key={order.id}
                className={selectedId === order.id ? 'bg-kingsley-50' : ''}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-700">
                  {order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatCurrency(order.total, order.currency)}
                </td>
                <td className="px-4 py-3 text-gray-500">{order.paymentMethod || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      ORDER_STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ORDER_STATUS_LABEL[order.status] || order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <select
                    onChange={(e) =>
                      e.target.value && handleChangeStatus(order.id, e.target.value)
                    }
                    defaultValue=""
                    className="border border-gray-300 rounded text-xs p-1 bg-white"
                  >
                    <option value="" disabled>
                      Cambiar
                    </option>
                    {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedId(selectedId === order.id ? null : order.id)
                    }
                    className="text-kingsley-600 hover:underline text-xs"
                  >
                    Guia
                  </button>
                </td>
              </tr>
            ))}
            {selectedId && (
              <tr>
                <td colSpan="6" className="bg-gray-50 p-4">
                  <form
                    onSubmit={(e) => handleTrackingSubmit(e, selectedId)}
                    className="flex items-center gap-2"
                  >
                    <input
                      placeholder="Numero de guia"
                      required
                      className="border border-gray-300 rounded p-2 text-sm flex-1"
                      value={tracking.trackingNumber}
                      onChange={(e) =>
                        setTracking({ ...tracking, trackingNumber: e.target.value })
                      }
                    />
                    <input
                      placeholder="Empresa (Guatex, Cargo Expreso...)"
                      required
                      className="border border-gray-300 rounded p-2 text-sm flex-1"
                      value={tracking.trackingCompany}
                      onChange={(e) =>
                        setTracking({ ...tracking, trackingCompany: e.target.value })
                      }
                    />
                    <button
                      type="submit"
                      className="bg-kingsley-600 hover:bg-kingsley-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Guardar guia
                    </button>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
