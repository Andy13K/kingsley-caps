import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/products/ProductGrid';

const CATEGORIES = ['Todas', 'Dad Hat', 'Trucker', 'Snapback', 'Fitted', 'Boina', 'Streetwear', 'Urban'];

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const { products, loading, error } = useProducts();

  const filtered = products.filter((p) => {
    const matchCat = category === 'Todas' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      {/* Encabezado oscuro */}
      <div className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <span className="block text-gold dark:text-gold-light text-sm font-bold uppercase tracking-widest mb-2">
            Colección completa
          </span>
          <h1 className="text-5xl font-black text-charcoal-950 dark:text-white tracking-tight mb-6">Catálogo</h1>
          <div className="relative max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
            <input
              type="search"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar productos"
              className="w-full pl-11 pr-4 py-3 bg-charcoal-50 dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/15 rounded-xl text-charcoal-950 dark:text-white placeholder:text-charcoal-800/70 dark:placeholder:text-zinc-400
                text-sm focus:outline-none focus:ring-2 focus:ring-blue-light focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filtros de categoría */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border
                ${category === cat
                  ? 'bg-blue-dark dark:bg-blue text-white border-blue-dark dark:border-blue shadow-sm'
                  : 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-zinc-200 border-charcoal-200 dark:border-white/10 hover:border-blue-dark/50 dark:hover:border-blue/50 hover:text-blue-dark dark:hover:text-blue-light'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Contador de resultados */}
        <p className="text-sm text-charcoal-800 dark:text-zinc-300 mb-6 font-medium">
          {loading ? 'Cargando productos...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </p>

        <ProductGrid products={filtered} loading={loading} error={error} />
      </div>
    </div>
  );
}
