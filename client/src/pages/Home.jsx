import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import Button from '../components/ui/Button';

function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-white dark:bg-charcoal-950 min-h-[100dvh] flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-0 items-center py-20 lg:py-0 lg:min-h-[100dvh]">

          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 animate-fade-up">
              <span className="h-px w-8 bg-gold" />
              <span className="text-gold text-sm font-bold uppercase tracking-widest">Nueva colección 2026</span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-charcoal-950 dark:text-white tracking-tighter leading-none animate-fade-up delay-100">
              GORRAS<br />
              <span className="text-gold">QUE</span><br />
              HABLAN.
            </h1>

            <p className="text-charcoal-800 dark:text-zinc-300 text-lg leading-relaxed max-w-md animate-fade-up delay-200">
              Diseñadas para quienes saben que el estilo empieza por arriba.
              Envíos a toda Guatemala. Paga con ETH o tarjeta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-300">
              <Button size="lg" variant="gold" onClick={() => navigate('/catalog')}>
                Ver catálogo
              </Button>
              <Button size="lg" variant="outline" className="border-charcoal-300 dark:border-white/30 text-charcoal-950 dark:text-white hover:bg-charcoal-50 dark:hover:bg-charcoal-800" onClick={() => navigate('/register')}>
                Crear cuenta gratis
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4 animate-fade-up delay-400">
              <div>
                <p className="text-2xl font-black text-charcoal-950 dark:text-white">6+</p>
                <p className="text-sm text-charcoal-700 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Modelos</p>
              </div>
              <div className="h-8 w-px bg-charcoal-200 dark:bg-white/15" />
              <div>
                <p className="text-2xl font-black text-charcoal-950 dark:text-white">100%</p>
                <p className="text-sm text-charcoal-700 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Calidad</p>
              </div>
              <div className="h-8 w-px bg-charcoal-200 dark:bg-white/15" />
              <div>
                <p className="text-2xl font-black text-charcoal-950 dark:text-white">ETH</p>
                <p className="text-sm text-charcoal-700 dark:text-zinc-400 uppercase tracking-wider mt-0.5">Aceptamos</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-end animate-fade-in delay-200">
            <div className="relative">
              <div className="w-[380px] h-[500px] rounded-3xl overflow-hidden">
                <img
                  src="https://placehold.co/760x1000/1e3a5f/f5f3ef?text=Kingsley+Caps"
                  alt="Kingsley Caps colección 2026"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 to-transparent rounded-3xl" />
              </div>

              <div className="absolute -bottom-6 -left-10 w-[160px] h-[200px] rounded-2xl overflow-hidden border-2 border-white dark:border-charcoal-950 animate-float">
                <img
                  src="https://placehold.co/320x400/4d5e3a/f5f3ef?text=Cerrada"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute top-8 -left-6 bg-white/95 dark:bg-charcoal-900/90 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3">
                <p className="text-gold text-xs font-bold uppercase tracking-wider">En stock</p>
                <p className="text-charcoal-950 dark:text-white font-bold text-sm">Cerrada Sin Hebilla</p>
                <p className="text-blue-light text-sm font-semibold">Q 180.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const navigate = useNavigate();
  const { products, loading } = useProducts({ featured: true });

  return (
    <section className="bg-cream dark:bg-charcoal-950 border-y border-charcoal-100 dark:border-white/10 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="block text-gold text-sm font-bold uppercase tracking-widest mb-1">Selección editorial</span>
            <h2 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight">Destacados</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/catalog')}>
            Ver todos &rarr;
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="h-72 animate-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 animate-shimmer rounded" />
                  <div className="h-4 w-2/3 animate-shimmer rounded" />
                  <div className="h-4 w-1/4 animate-shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BannerSection() {
  const navigate = useNavigate();
  return (
    <section className="bg-white dark:bg-charcoal-950 border-y border-charcoal-100 dark:border-white/10 py-24 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="rounded-3xl overflow-hidden h-80 lg:h-96">
          <img
            src="https://placehold.co/800x600/1a1a1a/c9933a?text=Paga+con+ETH"
            alt="Pago con criptomonedas"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <span className="block text-gold text-sm font-bold uppercase tracking-widest mb-2">Web3 Payments</span>
          <h2 className="text-4xl font-black text-charcoal-950 dark:text-white tracking-tight mb-4">
            Paga con<br />Ethereum.
          </h2>
          <p className="text-charcoal-800 dark:text-zinc-300 leading-relaxed mb-8">
            Conecta tu wallet MetaMask, confirma la transacción en Sepolia Testnet
            y recibe tu gorra. Sin bancos, sin intermediarios.
          </p>
          <Button variant="gold" size="lg" onClick={() => navigate('/catalog')}>
            Comprar ahora
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedSection />
      <BannerSection />
    </div>
  );
}
