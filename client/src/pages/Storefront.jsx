import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductGrid from '../components/products/ProductGrid';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

export default function Storefront() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/stores/slug/${slug}`)
      .then((res) => setStore(res.data.data.store))
      .catch((err) => setError(err.message || 'Tienda no encontrada'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !store) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="font-semibold text-charcoal-950 dark:text-white mb-3">{error ?? 'Tienda no encontrada'}</p>
        <Button variant="outline" onClick={() => navigate('/catalog')}>Volver al catalogo</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal-950">
      <section className="bg-white dark:bg-charcoal-950 border-b border-charcoal-100 dark:border-white/10 px-4 py-12">
        <div className="max-w-7xl mx-auto flex items-center gap-5">
          {store.logo_url && (
            <img src={store.logo_url} alt={store.name} className="h-20 w-20 rounded-xl object-cover border border-charcoal-100 dark:border-white/10" />
          )}
          <div>
            <span className="text-gold dark:text-gold-light text-xs font-semibold uppercase tracking-widest">Tienda oficial</span>
            <h1 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mt-1">{store.name}</h1>
            {store.description && <p className="text-charcoal-800 dark:text-zinc-400 mt-2 max-w-2xl">{store.description}</p>}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductGrid products={store.Products ?? store.products ?? []} loading={false} />
      </section>
    </div>
  );
}
