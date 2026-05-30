import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-charcoal-950 text-charcoal-800 dark:text-zinc-400 mt-auto border-t border-charcoal-100 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-charcoal-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-black text-white text-sm">KC</div>
              <span className="font-bold text-charcoal-950 dark:text-white tracking-tight">Kingsley Caps</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Gorras de autor para quienes saben que el estilo empieza por arriba. Guatemala, 2026.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-charcoal-700 dark:text-zinc-400 mb-4 font-semibold">Tienda</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/catalog" className="text-sm hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200">Catálogo</Link>
              <Link to="/cart" className="text-sm hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200">Carrito</Link>
              <Link to="/orders" className="text-sm hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200">Mis órdenes</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-charcoal-700 dark:text-zinc-400 mb-4 font-semibold">Cuenta</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/register" className="text-sm hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200">Registrarse</Link>
              <Link to="/login" className="text-sm hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200">Ingresar</Link>
            </div>
          </div>
        </div>
        <p className="text-xs text-center pt-8 text-charcoal-700 dark:text-zinc-400">
          &copy; 2026 Kingsley Caps &mdash; Proyecto académico UMG Puerto Barrios
        </p>
      </div>
    </footer>
  );
}
