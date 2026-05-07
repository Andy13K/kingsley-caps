import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency, formatDate } from '../utils/formatters';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const STATUS = {
  pending_payment: { label: 'Pendiente de pago', variant: 'warning' },
  paid:            { label: 'Pagado', variant: 'success' },
  preparing:       { label: 'En preparación', variant: 'info' },
  packed:          { label: 'Empacado', variant: 'info' },
  shipped:         { label: 'Enviado', variant: 'info' },
  delivered:       { label: 'Entregado', variant: 'success' },
  cancelled:       { label: 'Cancelado', variant: 'danger' },
  refunded:        { label: 'Reembolsado', variant: 'gray' },
};

const PAYMENT_LABELS = {
  crypto_eth: 'ETH',
  card:       'Tarjeta',
  transfer:   'Transferencia',
};

const LIMIT = 10;

function PaymentIcon({ method }) {
  if (method === 'crypto_eth') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (method === 'card') {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  );
}

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  const status = STATUS[order.status] ?? { label: order.status, variant: 'gray' };

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Orden #${order.id.slice(-8).toUpperCase()}`}>
      <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-xs text-charcoal-800/75 dark:text-zinc-400 font-medium">{formatDate(order.createdAt)}</span>
        </div>

        <div>
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest mb-2">Productos</p>
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-charcoal-800 dark:text-zinc-300">
                  {item.productName}
                  {(item.variantSize || item.variantColor) && (
                    <span className="text-charcoal-800/75 dark:text-zinc-400 ml-1 text-xs">
                      ({[item.variantSize, item.variantColor].filter(Boolean).join(' · ')})
                    </span>
                  )}
                  {' '}×{item.quantity}
                </span>
                <span className="flex-shrink-0 ml-4 font-semibold text-charcoal-950 dark:text-zinc-100">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-charcoal-100 dark:border-white/10 mt-3 pt-3 flex justify-between font-black text-charcoal-950 dark:text-zinc-50">
            <span>Total</span>
            <span className="text-blue-dark dark:text-blue-light">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest mb-2">Método de pago</p>
          <div className="flex items-center gap-2 text-sm text-charcoal-800 dark:text-zinc-300">
            <PaymentIcon method={order.paymentMethod} />
            {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest mb-2">Dirección de envío</p>
          <p className="text-sm text-charcoal-800 dark:text-zinc-300 leading-relaxed">
            {order.shippingAddress.name}<br />
            {order.shippingAddress.address}<br />
            {order.shippingAddress.city}
          </p>
        </div>

        {order.trackingNumber && (
          <div className="bg-charcoal-50 dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">Número de guía</p>
            <p className="font-mono font-bold text-white">{order.trackingNumber}</p>
            {order.trackingCompany && (
              <p className="text-xs text-zinc-400 mt-0.5">{order.trackingCompany}</p>
            )}
          </div>
        )}

        {order.deliveredAt && (
          <p className="text-xs text-charcoal-800/75 dark:text-zinc-400 text-center">
            Entregado el {formatDate(order.deliveredAt)}
          </p>
        )}
      </div>

      <Button variant="outline" className="w-full mt-5" onClick={onClose}>
        Cerrar
      </Button>
    </Modal>
  );
}

export default function MyOrders() {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { orders, total, loading, error } = useOrders(page, LIMIT);
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-gold text-xs font-semibold uppercase tracking-widest">Tu historial</span>
          <h1 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mt-1">Mis órdenes</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-charcoal-50 dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 flex items-center justify-center mb-5">
              <svg className="w-9 h-9 text-charcoal-800/70 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-charcoal-900 dark:text-zinc-100 font-black text-lg mb-1">Sin órdenes aún</p>
            <p className="text-charcoal-800/70 dark:text-zinc-400 text-sm">Tus compras aparecerán aquí.</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {orders.map((order, i) => {
                const status = STATUS[order.status] ?? { label: order.status, variant: 'gray' };
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    aria-label={`Ver detalle de orden ${order.id.slice(-8).toUpperCase()}`}
                    className="w-full text-left bg-white dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 rounded-2xl p-5
                      hover:border-blue-dark/30 dark:hover:border-blue/30 hover:shadow-lg hover:shadow-charcoal-950/5 hover:-translate-y-0.5
                      transition-all duration-200 animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex flex-col gap-1">
                        <p className="font-mono text-xs text-charcoal-800/75 dark:text-zinc-400 uppercase font-semibold">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-charcoal-800/70 dark:text-zinc-400 font-medium">{formatDate(order.createdAt)}</p>
                        <div className="flex items-center gap-1.5 text-xs text-charcoal-800/70 dark:text-zinc-400">
                          <PaymentIcon method={order.paymentMethod} />
                          {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                          <span className="text-charcoal-800/55 dark:text-zinc-400">·</span>
                          {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <p className="font-black text-blue-dark dark:text-blue-light text-lg">{formatCurrency(order.total)}</p>
                        {order.trackingNumber && (
                          <p className="text-xs text-gold-dark font-semibold">
                            Guía: {order.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-charcoal-50 dark:border-white/5 flex flex-wrap gap-1.5">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-xs bg-charcoal-50 dark:bg-charcoal-900 text-charcoal-700 dark:text-zinc-400 px-2.5 py-1 rounded-full font-medium">
                          {item.productName}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs text-charcoal-800/75 dark:text-zinc-400 px-1 py-1">+{order.items.length - 3} más</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
                <span className="text-sm text-charcoal-800/75 dark:text-zinc-400 font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Página siguiente"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
