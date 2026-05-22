import { formatCurrency } from '../../utils/formatters';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const subtotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 p-5">
      <div className="w-20 h-20 rounded-xl overflow-hidden border border-charcoal-100 dark:border-white/10 flex-shrink-0 bg-charcoal-50 dark:bg-charcoal-800">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-charcoal-500 dark:text-zinc-400 text-center px-2">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-charcoal-950 dark:text-zinc-50 text-sm leading-snug truncate">{item.name}</h3>
        {(item.size || item.color) && (
          <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 mt-0.5">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
        )}
        <p className="text-sm font-semibold text-blue-dark dark:text-blue-light mt-1">{formatCurrency(item.price)}</p>

        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Reducir cantidad"
            className="w-7 h-7 rounded-lg border border-charcoal-200 dark:border-white/15 flex items-center justify-center text-charcoal-700 dark:text-zinc-300
              hover:border-blue-dark dark:hover:border-blue hover:bg-blue-dark dark:hover:bg-blue hover:text-white
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-bold"
          >−</button>
          <span className="w-6 text-center text-sm font-bold text-charcoal-950 dark:text-zinc-50" aria-live="polite">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            aria-label="Aumentar cantidad"
            className="w-7 h-7 rounded-lg border border-charcoal-200 dark:border-white/15 flex items-center justify-center text-charcoal-700 dark:text-zinc-300
              hover:border-blue-dark dark:hover:border-blue hover:bg-blue-dark dark:hover:bg-blue hover:text-white
              disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-bold"
          >+</button>
          {item.quantity >= item.stock && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Máx.</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <button
          onClick={() => onRemove(item.variantId)}
          aria-label={`Eliminar ${item.name} del carrito`}
          className="text-charcoal-800/55 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-sm font-black text-charcoal-950 dark:text-zinc-50">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
