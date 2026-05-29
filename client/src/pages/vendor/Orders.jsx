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

const PAYMENT_LABEL = { crypto_eth: 'ETH', card: 'Tarjeta', cash: 'Efectivo', transfer: 'Transferencia' };
const PAYMENT_COLOR = {
  crypto_eth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  transfer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const STATUS_TRANSITIONS = { paid: 'preparing', preparing: 'packed', shipped: 'delivered' };
const STATUS_ACTIONS = { paid: 'Preparar', preparing: 'Empacar', shipped: 'Entregar' };

export default function VendorOrders() {
  const {
    orders,
    loading,
    pagination,
    fetchOrders,
    updateOrderStatus,
    addTracking,
    approveTransferPayment,
    rejectTransferPayment,
  } = useVendorOrders();
  const [filters, setFilters] = useState({ status: '', search: '', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [trackingModal, setTrackingModal] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ tracking_number: '', carrier: '', estimated_delivery: '', shipping_proof: null });
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
      await addTracking(trackingModal.id, {
        trackingNumber: trackingForm.tracking_number,
        trackingCompany: trackingForm.carrier,
        shippingProof: trackingForm.shipping_proof,
      });
      toast.success('Información de envío guardada');
      setTrackingModal(null);
    } catch {
      toast.error('Error al guardar tracking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveTransfer = async (order) => {
    if (!order.transfer_payment_id) {
      toast.error('Este pedido aun no tiene comprobante registrado');
      return;
    }
    try {
      await approveTransferPayment({ paymentId: order.transfer_payment_id, orderId: order.id });
      toast.success('Pago validado');
    } catch (err) {
      toast.error(err.message || 'No se pudo validar el pago');
    }
  };

  const handleRejectTransfer = async (order) => {
    if (!order.transfer_payment_id) return;
    try {
      await rejectTransferPayment({ paymentId: order.transfer_payment_id, orderId: order.id });
      toast.success('Comprobante rechazado');
    } catch (err) {
      toast.error(err.message || 'No se pudo rechazar el comprobante');
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
          className="px-3 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/40 w-48"
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
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-gold dark:text-gold-light" /></div>
        ) : orders.length === 0 ? (
          <p className="text-center py-12 text-sm text-charcoal-400 dark:text-zinc-500">Sin órdenes encontradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-white/10">
                  {['ID', 'Cliente', 'Tienda / productos', 'Fecha', 'Total', 'Liquidacion', 'Pago', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-50 dark:divide-white/5">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-charcoal-600 dark:text-zinc-400">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-charcoal-800 dark:text-zinc-200">{o.customer_name || o.customer?.name || '—'}</td>
                    <td className="px-4 py-3 min-w-64">
                      <div className="font-semibold text-charcoal-900 dark:text-white">{o.store_name}</div>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {(o.items || []).slice(0, 3).map((item) => (
                          <span key={item.id || item.sku} className="text-[11px] text-charcoal-500 dark:text-zinc-400">
                            {item.product_name || item.productName} x{item.quantity}
                          </span>
                        ))}
                        {(o.items || []).length > 3 && (
                          <span className="text-[11px] text-charcoal-400 dark:text-zinc-500">
                            +{o.items.length - 3} mas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-charcoal-900 dark:text-white whitespace-nowrap">Q{(o.total_fiat || 0).toLocaleString('es-GT')}</td>
                    <td className="px-4 py-3 text-xs text-charcoal-600 dark:text-zinc-400 whitespace-nowrap">
                      <div>Comision: Q{(o.platform_fee_amount || 0).toLocaleString('es-GT')}</div>
                      <div className="font-semibold text-gold dark:text-gold-light">Vendedor: Q{(o.vendor_payout_amount || 0).toLocaleString('es-GT')}</div>
                    </td>
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
                        {o.status === 'pending_payment' && o.payment_method === 'transfer' && (
                          <>
                            {o.transfer_proof_url ? (
                              <>
                                <a
                                  href={o.transfer_proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors whitespace-nowrap"
                                >
                                  Ver comprobante
                                </a>
                                <button
                                  onClick={() => handleApproveTransfer(o)}
                                  className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 transition-colors whitespace-nowrap"
                                >
                                  Aceptar pago
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(o)}
                                  className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap"
                                >
                                  Rechazar
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-charcoal-400 dark:text-zinc-500 whitespace-nowrap">
                                Esperando comprobante
                              </span>
                            )}
                          </>
                        )}
                        {STATUS_TRANSITIONS[o.status] && (
                          <button
                            onClick={() => handleStatusChange(o.id, STATUS_TRANSITIONS[o.status])}
                            className="text-xs font-medium text-gold dark:text-gold-light hover:text-gold-dark dark:hover:text-gold-light transition-colors whitespace-nowrap"
                          >
                            {STATUS_ACTIONS[o.status]}
                          </button>
                        )}
                        {o.status === 'packed' && (
                          <button
                            onClick={() => { setTrackingModal(o); setTrackingForm({ tracking_number: '', carrier: '', estimated_delivery: '', shipping_proof: null }); }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors whitespace-nowrap"
                          >
                            Enviar
                          </button>
                        )}
                        {o.status === 'shipped' && o.tracking && (
                          <a
                            href={o.tracking.shipping_proof_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-charcoal-400 dark:text-zinc-500 font-mono hover:text-gold"
                          >
                            {o.tracking.tracking_number}
                          </a>
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
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Imagen de guía de envío</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={(e) => setTrackingForm((f) => ({ ...f, shipping_proof: e.target.files?.[0] || null }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white file:mr-3 file:border-0 file:rounded-md file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-charcoal-950 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setTrackingModal(null)} className="flex-1 py-2 text-sm font-medium bg-zinc-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-charcoal-700 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm font-semibold bg-gold hover:bg-gold-dark text-white dark:bg-gold-light dark:text-charcoal-950 dark:hover:bg-gold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
