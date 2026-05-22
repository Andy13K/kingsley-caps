import { formatCurrency } from '../../utils/formatters';
import Button from '../ui/Button';

export default function CartSummary({ items, total, onCheckout, loading = false }) {
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-white/10 overflow-hidden sticky top-24">
      <div className="bg-charcoal-50 dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 px-6 py-5">
        <h2 className="font-black text-charcoal-950 dark:text-white text-lg tracking-tight">Resumen del pedido</h2>
      </div>

      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-charcoal-800/75 dark:text-zinc-400">
            <span>Productos ({count} {count === 1 ? 'artículo' : 'artículos'})</span>
            <span className="font-semibold text-charcoal-950 dark:text-zinc-50">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-charcoal-800/75 dark:text-zinc-400">
            <span>Envío</span>
            <span className="text-gold-dark dark:text-amber-400 font-semibold">Por calcular</span>
          </div>
        </div>

        <div className="border-t border-charcoal-100 dark:border-white/10 pt-4 flex justify-between font-black text-charcoal-950 dark:text-zinc-50 text-lg">
          <span>Total</span>
          <span className="text-blue-dark dark:text-blue-light">{formatCurrency(total)}</span>
        </div>

        <Button className="w-full" variant="blue" size="lg" onClick={onCheckout} loading={loading} disabled={items.length === 0}>
          Proceder al pago
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-charcoal-800/75 dark:text-zinc-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          ETH · Tarjeta · Transferencia
        </div>
      </div>
    </div>
  );
}
