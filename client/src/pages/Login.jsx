import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/validators';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name] || errors.general) setErrors((p) => ({ ...p, [name]: null, general: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLoginForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Bienvenido de nuevo');
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message;
      if (status === 429) {
        setRateLimited(true);
        toast.error('Demasiados intentos. Espera 15 minutos.');
        setTimeout(() => setRateLimited(false), 15 * 60 * 1000);
      } else if (status === 403) {
        setErrors({ general: msg || 'Tu cuenta está suspendida' });
      } else {
        setErrors({ general: msg || 'Correo o contraseña incorrectos' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative bg-charcoal-950">
        <img src="https://picsum.photos/seed/kc-login-side/800/1200" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-black text-white text-sm">KC</div>
            <span className="font-bold text-white tracking-tight">Kingsley Caps</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight mb-3">
            Tu estilo,<br />siempre contigo.
          </h2>
          <p className="text-zinc-400 leading-relaxed max-w-sm">
            Accede a tu cuenta para gestionar pedidos y guardar tus gorras favoritas.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 bg-cream dark:bg-charcoal-950 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8 animate-fade-up">
            <p className="text-gold text-xs font-semibold uppercase tracking-widest mb-2">Bienvenido</p>
            <h1 className="text-3xl font-black text-charcoal-950 dark:text-zinc-50 tracking-tight">Iniciar sesión</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 animate-fade-up delay-100">
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium" role="alert">
                {errors.general}
              </div>
            )}

            <Input id="email" name="email" type="email" label="Correo electrónico"
              placeholder="tu@email.com" value={form.email} onChange={handleChange}
              error={errors.email} autoComplete="email" disabled={loading || rateLimited} />

            <Input id="password" name="password" type="password" label="Contraseña"
              placeholder="••••••••" value={form.password} onChange={handleChange}
              error={errors.password} autoComplete="current-password" disabled={loading || rateLimited} />

            <Button type="submit" variant="blue" loading={loading} disabled={rateLimited} className="w-full mt-2" size="lg">
              {rateLimited ? 'Bloqueado temporalmente' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-charcoal-800/75 dark:text-zinc-400 mt-6 animate-fade-up delay-200">
            Sin cuenta?{' '}
            <Link to="/register" className="text-blue-dark dark:text-blue-light font-bold hover:underline transition-colors duration-200">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
