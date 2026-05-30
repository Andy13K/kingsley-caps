import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { validateRegisterForm } from '../utils/validators';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ROLES = [
  { value: 'customer', label: 'Cliente', desc: 'Quiero comprar gorras' },
  { value: 'vendor', label: 'Vendedor', desc: 'Quiero abrir mi tienda' },
];

const AUTH_BACKGROUNDS = ['gorra4.jpg', 'gorra1.jpg', 'gorra2.jpg'];

function AuthBackdrop() {
  return (
    <div className="hidden lg:block relative bg-charcoal-950 overflow-hidden">
      {AUTH_BACKGROUNDS.map((image) => (
        <img
          key={image}
          src={`/assets/kingsley/hero/${image}`}
          alt=""
          className="auth-bg-slide absolute inset-0 w-full h-full object-cover blur-[2px] opacity-0"
        />
      ))}
      <div className="absolute inset-0 bg-charcoal-950/58" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/55 to-charcoal-950/20" />
      <div className="relative h-full flex flex-col justify-center p-12 -translate-y-8 auth-copy-lift">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-black text-white text-sm">KC</div>
          <span className="font-bold text-white tracking-tight">Kingsley Caps</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight leading-tight mb-3">
          Unete a la<br />comunidad.
        </h2>
        <p className="text-zinc-300 leading-relaxed max-w-sm">
          Crea una cuenta para comprar, guardar tu direccion o abrir tu tienda como vendedor.
        </p>
      </div>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '', role: 'customer' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name] || errors.general) setErrors((p) => ({ ...p, [name]: null, general: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegisterForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        address: form.address || undefined,
        role: form.role,
      });
      toast.success('Cuenta creada. Bienvenido a Kingsley Caps');
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message;
      if (status === 409) setErrors({ email: 'Este email ya esta registrado' });
      else setErrors({ general: msg || 'Error al crear la cuenta. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2">
      <AuthBackdrop />

      <div className="flex items-center justify-center px-6 py-12 bg-cream dark:bg-charcoal-950 overflow-y-auto">
        <div className="w-full max-w-3xl">
          <div className="mb-8 animate-fade-up">
            <p className="text-gold dark:text-gold-light text-xs font-semibold uppercase tracking-widest mb-2">Nuevo aqui</p>
            <h1 className="text-3xl font-black text-charcoal-950 dark:text-zinc-50 tracking-tight">Crear cuenta</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up delay-100">
            {errors.general && (
              <div className="md:col-span-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium" role="alert">
                {errors.general}
              </div>
            )}

            <Input id="name" name="name" label="Nombre completo" placeholder="Ana Lopez"
              value={form.name} onChange={handleChange} error={errors.name} autoComplete="name" disabled={loading} />

            <Input id="email" name="email" type="email" label="Correo electronico" placeholder="ana@email.com"
              value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" disabled={loading} />

            <Input id="password" name="password" type="password" label="Contrasena"
              placeholder="Min. 8 caracteres, 1 mayuscula y 1 numero"
              value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" disabled={loading} />

            <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirmar contrasena"
              placeholder="Repite tu contrasena"
              value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" disabled={loading} />

            <Input id="phone" name="phone" type="tel" label="Telefono (opcional)" placeholder="+502 4521 8734"
              value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" disabled={loading} />

            <Input id="address" name="address" label="Direccion de envio (opcional)" placeholder="3ra Calle 5-23, Zona 1"
              value={form.address} onChange={handleChange} error={errors.address} autoComplete="street-address" disabled={loading} />

            <div className="md:col-span-2 flex flex-col gap-2">
              <p className="text-sm font-medium text-charcoal-900 dark:text-zinc-200">Tipo de cuenta</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex flex-col gap-0.5 p-3 rounded-xl border cursor-pointer transition-all duration-200
                      ${form.role === r.value
                        ? 'border-blue-dark dark:border-blue bg-blue-dark dark:bg-blue text-white'
                        : 'border-charcoal-100 dark:border-white/10 bg-white dark:bg-charcoal-900 text-charcoal-700 dark:text-zinc-300 hover:border-charcoal-300 dark:hover:border-white/25'
                      }`}
                  >
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={handleChange} disabled={loading} className="sr-only" />
                    <span className="font-bold text-sm">{r.label}</span>
                    <span className={`text-xs ${form.role === r.value ? 'text-blue-muted/80' : 'text-charcoal-800/70 dark:text-zinc-400'}`}>{r.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" variant="blue" loading={loading} className="w-full mt-2 md:col-span-2" size="lg">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-charcoal-800/75 dark:text-zinc-400 mt-6 animate-fade-up delay-200">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-dark dark:text-blue-light font-bold hover:underline transition-colors duration-200">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
