import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import CryptoPayment from '../components/checkout/CryptoPayment';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';

export default function CryptoCheckout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.total) navigate('/checkout', { replace: true });
  }, [state, navigate]);

  if (!state?.total) return null;
  const { shipping, items, total } = state;

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-gold text-xs font-semibold uppercase tracking-widest">Web3 Payment</span>
          <h1 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mt-1">Pagar con ETH</h1>
          <p className="text-charcoal-800 dark:text-zinc-400 text-sm mt-2">
            Red Sepolia Testnet · Total: <span className="text-blue-light font-bold">{formatCurrency(total)}</span>
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/checkout')}>
            Volver al checkout
          </Button>
        </div>
        <CryptoPayment shipping={shipping} items={items} total={total} />
      </div>
    </div>
  );
}
