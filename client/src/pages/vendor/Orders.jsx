<<<<<<< HEAD
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
=======
import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import useVendorOrders from '../../hooks/useVendorOrders';
import Spinner from '../../components/ui/Spinner';

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

const PAYMENT_LABEL = { crypto_eth: 'ETH', card: 'Tarjeta', cash: 'Efectivo' };
const PAYMENT_COLOR = {
  crypto_eth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const STATUS_TRANSITIONS = { paid: 'preparing', preparing: 'packed' };
const STATUS_ACTIONS = { paid: 'Preparar', preparing: 'Empacar' };

export default function VendorOrders() {
  const { orders, loading, pagination, fetchOrders, updateOrderStatus, addTracking } = useVendorOrders();
  const [filters, setFilters] = useState({ status: '', search: '', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ tracking_number: '', carrier: '', estimated_delivery: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchOrders({ ...filters, page, limit: 20 }); }, [filters, page, fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Orden marcada como "${STATUS_LABEL[newStatus]}"`);
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handleTracking = async (e) => {
    e.preventDefault();
    if (!trackingForm.tracking_number.trim() || !trackingForm.carrier.trim()) {
      toast.error('Número de guía y empresa son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      await addTracking(trackingModal.id, trackingForm);
      toast.success('Información de envío guardada');
      setTrackingModal(null);
    } catch {
      toast.error('Error al guardar tracking');
    } finally {
      setSubmitting(false);
    }
  };

  const setFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-950 dark:text-white">Órdenes</h1>
        <p className="text-sm text-charcoal-500 dark:text-zinc-400 mt-1">Gestiona los pedidos de tu tienda</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por ID…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/40 w-48"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-gold" /></div>
        ) : orders.length === 0 ? (
          <p className="text-center py-12 text-sm text-charcoal-400 dark:text-zinc-500">Sin órdenes encontradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-white/10">
                  {['ID', 'Cliente', 'Fecha', 'Total', 'Pago', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-50 dark:divide-white/5">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-charcoal-600 dark:text-zinc-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-charcoal-800 dark:text-zinc-200">{o.customer_name || o.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-charcoal-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-charcoal-900 dark:text-white whitespace-nowrap">Q{(o.total_fiat || 0).toLocaleString('es-GT')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLOR[o.payment_method] || 'bg-zinc-100 text-zinc-600'}`}>
                        {PAYMENT_LABEL[o.payment_method] || o.payment_method || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || ''}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {STATUS_TRANSITIONS[o.status] && (
                          <button
                            onClick={() => handleStatusChange(o.id, STATUS_TRANSITIONS[o.status])}
                            className="text-xs font-medium text-gold hover:text-gold-dark transition-colors whitespace-nowrap"
                          >
                            {STATUS_ACTIONS[o.status]}
                          </button>
                        )}
                        {o.status === 'packed' && (
                          <button
                            onClick={() => { setTrackingModal(o); setTrackingForm({ tracking_number: '', carrier: '', estimated_delivery: '' }); }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors whitespace-nowrap"
                          >
                            Enviar
                          </button>
                        )}
                        {o.status === 'shipped' && o.tracking && (
                          <span className="text-xs text-charcoal-400 dark:text-zinc-500 font-mono">{o.tracking.tracking_number}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-charcoal-500 dark:text-zinc-400">{pagination.total} órdenes en total</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors">
              ← Anterior
            </button>
            <span className="px-3 py-1.5 text-sm text-charcoal-600 dark:text-zinc-400">{page} / {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Tracking modal */}
      <Transition show={!!trackingModal} as={Fragment}>
        <Dialog onClose={() => setTrackingModal(null)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl p-6">
                <Dialog.Title className="text-base font-semibold text-charcoal-950 dark:text-white mb-1">
                  Información de envío
                </Dialog.Title>
                {trackingModal && (
                  <p className="text-sm text-charcoal-500 dark:text-zinc-400 mb-5">
                    Orden #{trackingModal.id.slice(0, 8).toUpperCase()}
                  </p>
                )}
                <form onSubmit={handleTracking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Número de guía <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Ej: 1Z999AA10123456784"
                      value={trackingForm.tracking_number}
                      onChange={(e) => setTrackingForm((f) => ({ ...f, tracking_number: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Empresa de envío <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Ej: DHL, UPS, Fedex"
                      value={trackingForm.carrier}
                      onChange={(e) => setTrackingForm((f) => ({ ...f, carrier: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Fecha estimada de entrega</label>
                    <input
                      type="date"
                      value={trackingForm.estimated_delivery}
                      onChange={(e) => setTrackingForm((f) => ({ ...f, estimated_delivery: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setTrackingModal(null)} className="flex-1 py-2 text-sm font-medium bg-zinc-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-charcoal-700 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm font-semibold bg-gold hover:bg-gold-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <Spinner size="sm" /> : null}
                      Confirmar envío
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
>>>>>>> origin/master
