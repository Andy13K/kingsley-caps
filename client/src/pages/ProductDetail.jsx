import { useState, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../utils/formatters';
import VariantSelector from '../components/products/VariantSelector';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const PLACEHOLDER_IMG = 'https://picsum.photos/seed/kc-placeholder/480/600';

class ProductErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-charcoal-800/75 dark:text-zinc-400 text-lg mb-4">Ocurrió un error al cargar el producto.</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProductDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { product, loading, error } = useProduct(id);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const firstAvailableVariant = product?.variants?.find((v) => v.active && v.stock > 0);
  const activeVariant = selectedVariant ?? firstAvailableVariant ?? null;
  const price = activeVariant?.price_override ?? product?.base_price;
  const outOfStock = activeVariant ? activeVariant.stock === 0 : true;

  const handleAddToCart = async () => {
    if (!activeVariant) { toast.error('Selecciona una variante'); return; }
    if (outOfStock) { toast.error('Sin stock disponible'); return; }
    setAddingToCart(true);
    try {
      addItem(product, activeVariant, 1);
      toast.success(`${product.name} agregado al carrito`);
    } catch { toast.error('No se pudo agregar al carrito'); }
    finally { setAddingToCart(false); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-charcoal-950"><Spinner size="lg" /></div>;
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center bg-cream dark:bg-charcoal-950">
        <div className="w-16 h-16 rounded-2xl bg-charcoal-50 dark:bg-charcoal-900 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-charcoal-800/55 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-charcoal-900 dark:text-zinc-100 font-semibold mb-1">{error ?? 'Producto no encontrado'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/catalog')}>Volver al catálogo</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-charcoal-800/75 dark:text-zinc-400 hover:text-charcoal-950 dark:hover:text-zinc-50 transition-colors duration-200 mb-8 group"
        >
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-up">
          <div className="rounded-3xl overflow-hidden border border-charcoal-100 dark:border-white/10 bg-charcoal-50 dark:bg-charcoal-800 aspect-[4/5] relative">
            <img src={product.images?.[0] ?? PLACEHOLDER_IMG} alt={product.name} className="w-full h-full object-cover" />
            {product.variants?.some((v) => v.active && v.stock > 0 && v.stock <= v.low_stock_threshold) && (
              <div className="absolute top-4 left-4">
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                  Pocas unidades
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 lg:py-4">
            <div className="animate-fade-up">
              <span className="text-gold-dark text-xs font-semibold uppercase tracking-widest">{product.category}</span>
              <h1 className="text-4xl font-black text-charcoal-950 dark:text-zinc-50 tracking-tight mt-2 leading-tight">{product.name}</h1>
              {product.description && (
                <p className="text-charcoal-800/75 dark:text-zinc-400 mt-3 leading-relaxed">{product.description}</p>
              )}
            </div>

            <div className="animate-fade-up delay-100">
              <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest mb-1">Precio</p>
              <p className="text-5xl font-black text-blue-dark dark:text-blue-light tracking-tight">
                {price ? formatCurrency(price) : '—'}
              </p>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="animate-fade-up delay-200">
                <VariantSelector variants={product.variants} selected={activeVariant} onChange={setSelectedVariant} />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 animate-fade-up delay-300">
              <Button size="lg" className="w-full" disabled={outOfStock} loading={addingToCart} onClick={handleAddToCart}>
                {outOfStock ? 'Sin stock disponible' : 'Agregar al carrito'}
              </Button>
              {!outOfStock && (
                <Button size="lg" variant="blue" className="w-full" onClick={async () => { await handleAddToCart(); navigate('/cart'); }}>
                  Comprar ahora
                </Button>
              )}
            </div>

            <div className="border-t border-charcoal-100 dark:border-white/10 pt-4 flex flex-col gap-2 animate-fade-up delay-300">
              {[
                { icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Devoluciones en 30 días' },
                { icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', text: 'Envío a todo Guatemala' },
                { icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z', text: 'Pago en ETH, tarjeta o transferencia' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-charcoal-800/75 dark:text-zinc-400">
                  <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  return <ProductErrorBoundary><ProductDetailContent /></ProductErrorBoundary>;
}
