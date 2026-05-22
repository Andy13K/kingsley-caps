import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatters';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const STATUS_LABELS = {
  pending_payment: { label: 'Pendiente de pago', variant: 'warning' },
  paid:            { label: 'Pagado', variant: 'success' },
  preparing:       { label: 'En preparación', variant: 'info' },
  shipped:         { label: 'Enviado', variant: 'info' },
  delivered:       { label: 'Entregado', variant: 'success' },
  cancelled:       { label: 'Cancelado', variant: 'danger' },
};

export default function OrderConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center bg-cream dark:bg-charcoal-950">
        <p className="text-charcoal-800/75 dark:text-zinc-400 mb-4">No se encontró información de la orden.</p>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    );
  }

  const status = STATUS_LABELS[order.status] ?? { label: order.status, variant: 'gray' };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-dark/20 border border-blue-dark/30 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-gold dark:text-gold-light text-xs font-semibold uppercase tracking-widest">Pedido recibido</span>
        <h1 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mt-2">Orden confirmada</h1>
        <p className="text-charcoal-800 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Gracias por tu compra. Te avisaremos cuando tu pedido esté en camino.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-white/10 overflow-hidden animate-fade-up">
          <div className="p-6 flex items-center justify-between flex-wrap gap-3 border-b border-charcoal-50 dark:border-white/5">
            <div>
              <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest font-semibold">Número de orden</p>
              <p className="font-mono font-bold text-charcoal-950 dark:text-zinc-100 mt-0.5">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest font-semibold mb-1">Estado</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>

          {order.createdAt && (
            <div className="px-6 py-4 border-b border-charcoal-50 dark:border-white/5">
              <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest font-semibold mb-1">Fecha</p>
              <p className="text-sm text-charcoal-800 dark:text-zinc-300">{formatDate(order.createdAt)}</p>
            </div>
          )}

          {order.items && order.items.length > 0 && (
            <div className="px-6 py-4 border-b border-charcoal-50 dark:border-white/5">
              <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest font-semibold mb-3">Productos</p>
              <div className="flex flex-col gap-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-charcoal-800 dark:text-zinc-300">
                      {item.productName ?? item.name} ×{item.quantity}
                      {(item.variantSize || item.variantColor) && (
                        <span className="text-charcoal-800/75 dark:text-zinc-400 ml-1">
                          ({[item.variantSize, item.variantColor].filter(Boolean).join(' · ')})
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-charcoal-950 dark:text-zinc-100 ml-4">
                      {formatCurrency(item.subtotal ?? item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-4 flex justify-between font-black text-charcoal-950 dark:text-zinc-50 text-lg">
            <span>Total pagado</span>
            <span className="text-blue-dark dark:text-blue-light">{formatCurrency(order.total)}</span>
          </div>

          {order.shippingAddress && (
            <div className="px-6 py-4 border-t border-charcoal-50 dark:border-white/5">
              <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest font-semibold mb-1">Envío a</p>
              <p className="text-sm text-charcoal-800 dark:text-zinc-300">
                {order.shippingAddress.name} — {order.shippingAddress.address}, {order.shippingAddress.city}
              </p>
            </div>
          )}

          {order.txHash && (
            <div className="px-6 py-4 border-t border-charcoal-50 dark:border-white/5">
              <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest font-semibold mb-1">TX Hash (Sepolia)</p>
              <p className="font-mono text-xs text-blue-dark dark:text-blue-light break-all">{order.txHash}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 animate-fade-up delay-100">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/orders')}>
            Ver mis órdenes
          </Button>
          <Button variant="blue" className="flex-1" onClick={() => navigate('/catalog')}>
            Seguir comprando
          </Button>
        </div>
      </div>
    </div>
  );
}
