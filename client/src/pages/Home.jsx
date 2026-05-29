import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import ProductCard from '../components/products/ProductCard';
import Button from '../components/ui/Button';

const isOfficialProduct = (product) => {
  const slug = product.Store?.slug ?? product.store?.slug ?? '';
  return slug === 'kingsley-caps-oficial';
};

const storeName = (product) => product.Store?.name ?? product.store?.name ?? 'Tienda';

function ProductRail({ title, eyebrow, products, emptyText }) {
  const navigate = useNavigate();

  return (
    <section className="py-16 border-t border-charcoal-100 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="block text-gold dark:text-gold-light text-xs font-bold uppercase tracking-widest mb-2">{eyebrow}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-charcoal-950 dark:text-white tracking-tight">{title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/catalog')}>
            Ver catálogo
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="border border-charcoal-100 dark:border-white/10 bg-white dark:bg-charcoal-900 rounded-xl p-8 text-sm text-charcoal-700 dark:text-zinc-300">
            {emptyText}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
            {products.slice(0, 6).map((product, index) => (
              <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroSection({ isAuthenticated }) {
  const navigate = useNavigate();

  return (
    <section className="relative bg-charcoal-950 overflow-hidden border-b border-white/10">
      <div className="absolute inset-0">
        <img src="/assets/kingsley/hero/gorra2.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-charcoal-950/76" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/82 to-charcoal-950/36" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-4xl flex flex-col gap-7">
            <div className="inline-flex items-center gap-2 animate-fade-up">
              <span className="h-px w-8 bg-gold" />
              <span className="text-gold dark:text-gold-light text-sm font-bold uppercase tracking-widest">Kingsley Caps</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none animate-fade-up delay-100">
              Gorras de marca y de vendedores reales.
            </h1>

            <p className="text-zinc-100 text-lg leading-relaxed max-w-2xl animate-fade-up delay-200">
              Explora la colección oficial Kingsley Caps y las tiendas creadas por vendedores. Puedes ver todo el catálogo sin cuenta; para agregar al carrito y comprar debes iniciar sesión o registrarte.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-300">
              <Button size="lg" variant="gold" onClick={() => navigate('/catalog')}>
                Ver catálogo
              </Button>
              {!isAuthenticated && (
                <>
                  <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/10" onClick={() => navigate('/register')}>
                    Crear cuenta
                  </Button>
                  <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/login')}>
                    Ingresar
                  </Button>
                </>
              )}
            </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const items = [
    ['Explora', 'La página de inicio y el catálogo muestran gorras oficiales y gorras de vendedores independientes.'],
    ['Inicia sesión', 'Para agregar al carrito o comprar, la app exige cuenta activa de cliente.'],
    ['Compra', 'El checkout usa dirección de envío, método de pago y crea una orden real en backend.'],
    ['Vende', 'Cada vendedor administra solo sus productos, imágenes, variantes y stock desde su panel.'],
  ];

  return (
    <section className="bg-white dark:bg-charcoal-950 py-16 border-t border-charcoal-100 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10">
          <div>
            <span className="block text-gold dark:text-gold-light text-xs font-bold uppercase tracking-widest mb-2">Cómo funciona</span>
            <h2 className="text-3xl sm:text-4xl font-black text-charcoal-950 dark:text-white tracking-tight">Una vitrina, muchas tiendas.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(([title, text]) => (
              <div key={title} className="border-t border-charcoal-200 dark:border-white/15 pt-4">
                <h3 className="font-black text-charcoal-950 dark:text-white">{title}</h3>
                <p className="text-sm text-charcoal-700 dark:text-zinc-400 leading-relaxed mt-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VendorSection({ storesCount, isAuthenticated }) {
  const navigate = useNavigate();

  return (
    <section className="bg-charcoal-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-center">
        <div>
          <span className="block text-gold dark:text-gold-light text-xs font-bold uppercase tracking-widest mb-2">Vendedores</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Cada tienda controla su propio inventario.</h2>
          <p className="text-zinc-300 leading-relaxed mt-4 max-w-2xl">
            Los vendedores pueden crear su tienda, subir gorras con 3 a 5 imágenes, manejar variantes y ajustar stock. El dueño de Kingsley puede revisar el inventario global desde administración.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {!isAuthenticated && (
              <Button variant="gold" onClick={() => navigate('/register')}>
                Quiero vender
              </Button>
            )}
            <Button variant="outline" className="border-white/60 text-white hover:bg-white/10" onClick={() => navigate('/catalog')}>
              Ver gorras
            </Button>
          </div>
        </div>
        <div className="border border-white/10 bg-white/5 rounded-xl p-6">
          <p className="text-5xl font-black text-gold dark:text-gold-light">{storesCount}</p>
          <p className="text-white font-bold mt-2">tiendas activas en el catálogo</p>
          <p className="text-zinc-400 text-sm mt-2">Incluye Kingsley Caps Oficial y vendedores independientes.</p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { products, loading, error } = useProducts({ limit: 24 });
  const { isAuthenticated } = useAuth();
  const officialProducts = products.filter(isOfficialProduct);
  const vendorProducts = products.filter((product) => !isOfficialProduct(product));
  const storeCount = new Set(products.map((product) => product.Store?.id ?? product.store?.id).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="min-h-[70dvh] bg-charcoal-950 flex items-center justify-center">
        <div className="text-white font-bold">Cargando catálogo...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-cream dark:bg-charcoal-950">
      <HeroSection isAuthenticated={isAuthenticated} />
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        </div>
      )}
      <HowItWorks />
      <ProductRail
        eyebrow="Colección oficial"
        title="Gorras propias de Kingsley"
        products={officialProducts}
        emptyText="Todavía no hay productos oficiales activos."
      />
      <ProductRail
        eyebrow="Tiendas de usuarios"
        title="Gorras vendidas por vendedores"
        products={vendorProducts}
        emptyText="Todavía no hay productos de vendedores activos."
      />
      <VendorSection storesCount={storeCount} isAuthenticated={isAuthenticated} />
    </div>
  );
}
