import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const PLACEHOLDER = 'https://picsum.photos/seed/kc-placeholder/480/600';

const isLowStock = (p) => p.variants?.some((v) => v.active && v.stock > 0 && v.stock <= v.low_stock_threshold);
const getMinPrice = (p) => {
  const prices = p.variants?.filter((v) => v.active).map((v) => v.price_override ?? p.base_price);
  return prices?.length ? Math.min(...prices) : p.base_price;
};

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const image = product.images?.[0] ?? PLACEHOLDER;
  const lowStock = isLowStock(product);
  const price = getMinPrice(product);

  return (
    <article
      onClick={() => navigate(`/products/${product.id}`)}
      className="group cursor-pointer bg-white dark:bg-charcoal-900 rounded-2xl overflow-hidden border border-charcoal-100 dark:border-white/15
        transition-all duration-300 ease-smooth hover:shadow-xl hover:shadow-charcoal-950/10 dark:hover:shadow-black/40 hover:-translate-y-1"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${product.id}`)}
      aria-label={`Ver detalle de ${product.name}, ${formatCurrency(price)}`}
    >
      <div className="relative overflow-hidden h-72 bg-charcoal-50 dark:bg-charcoal-800">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {lowStock && (
          <div className="absolute top-3 left-3">
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
              Pocas unidades
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-smooth">
          <div className="bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
            <p className="text-charcoal-950 dark:text-zinc-50 text-sm font-semibold">Ver detalle</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <span className="text-gold-dark text-xs font-semibold uppercase tracking-wider">{product.category}</span>
        <h3 className="font-bold text-charcoal-950 dark:text-zinc-50 text-base leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-charcoal-800/70 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <p className="font-black text-blue-dark dark:text-blue-light text-lg mt-1">{formatCurrency(price)}</p>
      </div>
    </article>
  );
}
