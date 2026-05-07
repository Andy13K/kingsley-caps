import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-charcoal-100 dark:border-white/15 bg-white dark:bg-charcoal-900">
      <div className="h-72 animate-shimmer" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-1/4 animate-shimmer rounded-full" />
        <div className="h-4 w-3/4 animate-shimmer rounded-full" />
        <div className="h-3 w-full animate-shimmer rounded-full" />
        <div className="h-3 w-2/3 animate-shimmer rounded-full" />
        <div className="h-5 w-1/3 animate-shimmer rounded-full mt-2" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-charcoal-900 dark:text-zinc-100 font-semibold">Error al cargar productos</p>
        <p className="text-charcoal-800/70 dark:text-zinc-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-charcoal-50 dark:bg-charcoal-900 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-charcoal-800/55 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
        </div>
        <p className="text-charcoal-900 dark:text-zinc-100 font-semibold">Sin resultados</p>
        <p className="text-charcoal-800/70 dark:text-zinc-400 text-sm mt-1">Prueba con otros filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, i) => (
        <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
