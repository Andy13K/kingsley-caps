import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const isLowStock = (p) => p.variants?.some((v) => v.active && v.stock > 0 && v.stock <= v.low_stock_threshold);
const getMinPrice = (p) => {
  const prices = p.variants?.filter((v) => v.active).map((v) => v.price_override ?? p.base_price);
  return prices?.length ? Math.min(...prices) : p.base_price;
};

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const image = product.images?.[0] ?? null;
  const lowStock = isLowStock(product);
  const price = getMinPrice(product);
  const store = product.Store ?? product.store;
  const isOfficial = store?.slug === 'kingsley-caps-oficial';
  const thumbnails = product.images?.slice(0, 5) ?? [];

  return (
    <article
      onClick={() => navigate(`/products/${product.id}`)}
      className="group cursor-pointer bg-white dark:bg-charcoal-900 rounded-xl overflow-hidden border border-charcoal-100 dark:border-white/15
        transition-all duration-300 ease-smooth hover:shadow-xl hover:shadow-charcoal-950/10 dark:hover:shadow-black/40 hover:-translate-y-1"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${product.id}`)}
      aria-label={`Ver detalle de ${product.name}, ${formatCurrency(price)}`}
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-gradient-to-b from-white to-charcoal-50 dark:from-charcoal-800 dark:to-charcoal-900">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-3 transition-transform duration-500 ease-smooth group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-6 text-center text-sm font-semibold text-charcoal-500 dark:text-zinc-400">
            Sin imagen cargada
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-charcoal-950/18 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {lowStock && (
          <div className="absolute top-3 left-3">
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
              Pocas unidades
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <span className="bg-white/92 dark:bg-charcoal-950/85 text-charcoal-900 dark:text-zinc-100 border border-white/60 dark:border-white/10 text-xs font-bold px-2.5 py-1 rounded-full">
            {isOfficial ? 'Marca Kingsley' : 'Vendedor'}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-smooth">
          <div className="bg-white/90 dark:bg-charcoal-900/90 backdrop-blur-sm rounded-lg px-4 py-2.5 text-center border border-white/50 dark:border-white/10">
            <p className="text-charcoal-950 dark:text-zinc-50 text-sm font-semibold">Ver detalle</p>
          </div>
        </div>
      </div>

      {thumbnails.length > 1 && (
        <div className="flex justify-center px-4 pt-3">
          <div
            className="grid justify-center gap-2"
            style={{ gridTemplateColumns: `repeat(${thumbnails.length}, minmax(0, 64px))` }}
          >
            {thumbnails.map((thumb, index) => (
              <div
                key={thumb}
                className={`aspect-square rounded-md overflow-hidden border bg-charcoal-50 dark:bg-charcoal-800 ${
                  index === 0 ? 'border-gold/70 dark:border-gold-light/80' : 'border-charcoal-100 dark:border-white/10'
                }`}
              >
                <img src={thumb} alt="" loading="lazy" className="w-full h-full object-contain p-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col items-center text-center gap-2">
        <span className="text-gold-dark dark:text-gold-light text-xs font-semibold uppercase tracking-wider">{product.category}</span>
        <h3 className="font-bold text-charcoal-950 dark:text-zinc-50 text-base leading-snug">{product.name}</h3>
        {store?.name && (
          <p className="text-blue-dark dark:text-blue-light text-xs font-bold line-clamp-1">
            {store.name}
          </p>
        )}
        {product.description && (
          <p className="text-charcoal-800/70 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <p className="font-black text-blue-dark dark:text-blue-light text-lg mt-1">{formatCurrency(price)}</p>
      </div>
    </article>
  );
}
