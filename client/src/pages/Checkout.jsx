import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';
import ShippingForm from '../components/checkout/ShippingForm';
import PaymentSelector from '../components/checkout/PaymentSelector';
import Button from '../components/ui/Button';
import api from '../services/api';

const EMPTY_SHIPPING = { name: '', address: '', city: '', phone: '' };

const validateShipping = (data) => {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Nombre requerido';
  if (!data.address.trim()) errors.address = 'Dirección requerida';
  if (!data.city.trim()) errors.city = 'Ciudad requerida';
  if (!data.phone.trim()) errors.phone = 'Teléfono requerido';
  return errors;
};

const buildMockOrder = (items, total, shipping, paymentMethod) => ({
  id: `ORD-${Date.now().toString(36).toUpperCase()}`,
  status: paymentMethod === 'transfer' ? 'pending_payment' : 'paid',
  total,
  paymentMethod,
  items: items.map((i) => ({
    productName: i.name,
    variantSize: i.size,
    variantColor: i.color,
    quantity: i.quantity,
    unitPrice: i.price,
    subtotal: i.price * i.quantity,
  })),
  shippingAddress: shipping,
  createdAt: new Date().toISOString(),
});

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [shippingErrors, setShippingErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('crypto_eth');
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    navigate('/cart', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateShipping(shipping);
    if (Object.keys(errors).length > 0) { setShippingErrors(errors); return; }

    if (paymentMethod === 'crypto_eth') {
      navigate('/checkout/crypto', { state: { shipping, items, total } });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.price })),
        shippingAddress: shipping,
        paymentMethod,
        total,
      });
      clearCart();
      navigate('/order-confirmation', { state: { order: data.data.order }, replace: true });
    } catch {
      const mockOrder = buildMockOrder(items, total, shipping, paymentMethod);
      clearCart();
      toast.success(
        paymentMethod === 'transfer'
          ? 'Orden creada. Realiza la transferencia para confirmar.'
          : '¡Pago con tarjeta procesado con éxito!'
      );
      navigate('/order-confirmation', { state: { order: mockOrder }, replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <span className="text-gold text-xs font-semibold uppercase tracking-widest">Finalizar compra</span>
          <h1 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mt-1">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6 animate-fade-up">
              <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-white/10 p-6">
                <ShippingForm
                  data={shipping}
                  errors={shippingErrors}
                  onChange={setShipping}
                  disabled={submitting}
                />
              </div>

              <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-white/10 p-6">
                <PaymentSelector
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="lg:col-span-1 animate-fade-up delay-100">
              <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-100 dark:border-white/10 overflow-hidden sticky top-24">
                <div className="bg-charcoal-50 dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 px-6 py-4">
                  <h2 className="font-black text-charcoal-950 dark:text-white tracking-tight">Tu pedido</h2>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex justify-between text-sm">
                        <span className="text-charcoal-800 dark:text-zinc-300 truncate mr-2">
                          {item.name} ×{item.quantity}
                        </span>
                        <span className="flex-shrink-0 font-semibold text-charcoal-950 dark:text-zinc-50">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-charcoal-100 dark:border-white/10 pt-4 flex justify-between font-black text-charcoal-950 dark:text-zinc-50 text-lg">
                    <span>Total</span>
                    <span className="text-blue-dark dark:text-blue-light">{formatCurrency(total)}</span>
                  </div>

                  <Button
                    type="submit"
                    variant="blue"
                    size="lg"
                    className="w-full"
                    loading={submitting}
                  >
                    {paymentMethod === 'crypto_eth' ? 'Continuar con ETH' : 'Confirmar pedido'}
                  </Button>

                  <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => navigate('/cart')} disabled={submitting}>
                    Volver al carrito
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
