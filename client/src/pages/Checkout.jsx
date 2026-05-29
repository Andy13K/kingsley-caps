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
  if (!data.address.trim()) errors.address = 'Direccion requerida';
  if (!data.city.trim()) errors.city = 'Ciudad requerida';
  if (!data.phone.trim()) errors.phone = 'Telefono requerido';
  return errors;
};

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    ...EMPTY_SHIPPING,
    name: user?.name ?? '',
    address: user?.address ?? '',
    phone: user?.phone ?? '',
  });
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
    if (Object.keys(errors).length > 0) {
      setShippingErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const storeIds = [...new Set(items.map((i) => i.storeId).filter(Boolean))];
      if (storeIds.length !== 1) {
        toast.error('Tu carrito debe contener productos de una sola tienda para crear la orden.');
        return;
      }

      const { data } = await api.post('/orders', {
        storeId: storeIds[0],
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        shippingAddress: shipping,
        paymentMethod,
        shippingMethod: 'standard',
        shippingAmount: 0,
      });

      const order = data.data.order;
      if (paymentMethod === 'crypto_eth') {
        navigate('/checkout/crypto', { state: { order, total: Number(order.total ?? total) } });
        return;
      }

      clearCart();
      navigate('/order-confirmation', { state: { order }, replace: true });
    } catch (err) {
      toast.error(err.message || 'No se pudo crear la orden. Revisa el carrito e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <span className="text-gold dark:text-gold-light text-xs font-semibold uppercase tracking-widest">Finalizar compra</span>
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
                      <div key={item.variantId} className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 text-charcoal-800 dark:text-zinc-300">
                          <span className="block truncate font-semibold">{item.name} x{item.quantity}</span>
                          <span className="block truncate text-xs text-blue-dark dark:text-blue-light">{item.storeName ?? 'Tienda'}</span>
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
                    {paymentMethod === 'crypto_eth' ? 'Crear orden y pagar ETH' : 'Crear orden'}
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
