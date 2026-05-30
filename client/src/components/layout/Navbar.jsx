import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../ui/NotificationBell';

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function CartIcon({ count }) {
  return (
    <Link to="/cart" className="relative p-2 text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200" aria-label={`Carrito, ${count} artículos`}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-dark text-white text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); navigate('/'); toast.success('Hasta pronto'); }
    catch { toast.error('Error al cerrar sesión'); }
  };

  const navLink = 'text-sm text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200 font-medium';

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 dark:bg-charcoal-950/95 backdrop-blur-md border-charcoal-100 dark:border-white/10 shadow-lg shadow-charcoal-950/5 dark:shadow-black/30' : 'bg-white dark:bg-charcoal-950 border-charcoal-100 dark:border-white/10'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/assets/kingsley/brand/logo.jpg"
              alt="Kingsley Caps"
              className="w-9 h-9 rounded-lg object-cover border border-gold/30 transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-bold text-charcoal-950 dark:text-white tracking-tight hidden sm:block">Kingsley Caps</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/catalog" className={navLink}>Catálogo</Link>
            {isAuthenticated && <Link to="/orders" className={navLink}>Mis órdenes</Link>}
            {isAuthenticated && ['vendor', 'staff', 'superadmin'].includes(user?.role) && (
              <Link to="/vendor/dashboard" className={navLink}>Panel vendedor</Link>
            )}
            {isAuthenticated && user?.role === 'superadmin' && (
              <Link to="/admin/dashboard" className={navLink}>Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="p-2 text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {isAuthenticated && <NotificationBell />}
            {isAuthenticated && <CartIcon count={count} />}

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2 ml-1">
                <span className="text-sm text-charcoal-800 dark:text-zinc-300 font-medium">{user.name.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200 font-medium px-3 py-1.5 rounded-lg hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-1">
                <button onClick={() => navigate('/login')} className={`${navLink} px-3 py-1.5 rounded-lg hover:bg-charcoal-50 dark:hover:bg-charcoal-800`}>
                  Ingresar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-sm font-semibold bg-gold hover:bg-gold-dark text-white dark:bg-gold-light dark:text-charcoal-950 dark:hover:bg-gold px-4 py-1.5 rounded-lg transition-colors duration-200 active:scale-95"
                >
                  Registro
                </button>
              </div>
            )}

            <button
              className="md:hidden p-2 text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white ml-1"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-charcoal-100 dark:border-white/10 py-4 flex flex-col gap-3 animate-fade-in">
            <Link to="/catalog" className="text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white px-2 py-1 text-sm font-medium">Catálogo</Link>
            {isAuthenticated && <Link to="/orders" className="text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white px-2 py-1 text-sm font-medium">Mis órdenes</Link>}
            {isAuthenticated && ['vendor', 'staff', 'superadmin'].includes(user?.role) && (
              <Link to="/vendor/dashboard" className="text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white px-2 py-1 text-sm font-medium">Panel vendedor</Link>
            )}
            {isAuthenticated && user?.role === 'superadmin' && (
              <Link to="/admin/dashboard" className="text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white px-2 py-1 text-sm font-medium">Admin</Link>
            )}
            <button
              onClick={toggle}
              className="text-left text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white px-2 py-1 text-sm font-medium flex items-center gap-2"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </button>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-left text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white px-2 py-1 text-sm font-medium">Salir</button>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => navigate('/login')} className="text-left text-charcoal-800 dark:text-zinc-300 px-2 py-1 text-sm font-medium">Ingresar</button>
                <button onClick={() => navigate('/register')} className="bg-gold text-white dark:bg-gold-light dark:text-charcoal-950 rounded-lg px-4 py-2 text-sm font-semibold text-center">Crear cuenta</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
