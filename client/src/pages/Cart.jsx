import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

export default function Cart() {
  const { items, total, loading, error, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-cream dark:bg-charcoal-950">
        <div className="w-16 h-16 rounded-2xl bg-charcoal-950 dark:bg-charcoal-800 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m-4.5 0h13.5m-13.5 0L5.625 19.5h12.75L19.5 9" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-charcoal-950 dark:text-zinc-50 mb-1">Inicia sesión primero</h2>
        <p className="text-charcoal-800/70 dark:text-zinc-400 text-sm mb-6">Necesitas una cuenta para ver tu carrito.</p>
        <Button onClick={() => navigate('/login')}>Iniciar sesión</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-cream dark:bg-charcoal-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-cream dark:bg-charcoal-950">
        <div className="w-20 h-20 rounded-2xl bg-charcoal-50 dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 flex items-center justify-center mb-5">
          <svg className="w-9 h-9 text-charcoal-800/70 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-charcoal-950 dark:text-zinc-50 mb-1">Tu carrito está vacío</h2>
        <p className="text-charcoal-800/70 dark:text-zinc-400 text-sm mb-6">Agrega productos desde el catálogo para empezar.</p>
        <Button variant="outline" onClick={() => navigate('/catalog')}>Ver catálogo</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <span className="text-gold dark:text-gold-light text-xs font-semibold uppercase tracking-widest">Tu selección</span>
          <h1 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mt-1">Mi carrito</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 animate-fade-up">
            <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-white/10 divide-y divide-charcoal-50 dark:divide-white/10 overflow-hidden">
              {items.map((item) => (
                <CartItem key={item.variantId} item={item} onUpdateQuantity={updateQuantity} onRemove={removeItem} />
              ))}
            </div>
            <button
              onClick={() => navigate('/catalog')}
              className="mt-5 inline-flex items-center gap-2 text-sm text-charcoal-800/75 dark:text-zinc-400 hover:text-charcoal-950 dark:hover:text-zinc-50 transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Seguir comprando
            </button>
          </div>

          <div className="lg:col-span-1 animate-fade-up delay-100">
            <CartSummary items={items} total={total} loading={loading} onCheckout={() => navigate('/checkout')} />
          </div>
        </div>
      </div>
    </div>
  );
}
