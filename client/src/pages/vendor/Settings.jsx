import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';

const ETH_REGEX = /^0x[0-9a-fA-F]{40}$/;

const DEFAULT_STORE = {
  name: '',
  description: '',
  logo_url: '',
  status: 'draft',
  crypto_enabled: false,
  eth_wallet_address: '',
  required_confirmations: 3,
  shipping_methods: [
    { id: 1, name: 'Envío estándar', price: 35, estimated_days: '3-5 días hábiles' },
    { id: 2, name: 'Envío express', price: 75, estimated_days: '1-2 días hábiles' },
  ],
};

export default function VendorSettings() {
  const [store, setStore] = useState(DEFAULT_STORE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ethError, setEthError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [hasStore, setHasStore] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/stores/my');
        const s = data.data;
        setHasStore(true);
        setStore({
          slug: s.slug || '',
          name: s.name || '',
          description: s.description || '',
          logo_url: s.logo_url || '',
          status: s.status || 'draft',
          crypto_enabled: s.crypto_enabled ?? false,
          eth_wallet_address: s.eth_wallet_address || '',
          required_confirmations: s.eth_confirmations_required ?? s.required_confirmations ?? 3,
          shipping_methods: s.shipping_methods?.length ? s.shipping_methods : DEFAULT_STORE.shipping_methods,
        });
      } catch (err) {
        if ((err.message || '').toLowerCase().includes('tienda')) {
          setHasStore(false);
          setLoadError('Aun no tienes tienda. Completa el formulario para crearla.');
        } else {
          setLoadError(err.message || 'No se pudo cargar la tienda.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, value) => setStore((s) => ({ ...s, [key]: value }));

  const validateEth = (addr) => {
    if (!addr) { setEthError(''); return true; }
    if (!ETH_REGEX.test(addr)) { setEthError('Dirección inválida. Debe empezar con 0x seguido de 40 caracteres hexadecimales.'); return false; }
    setEthError('');
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (store.crypto_enabled && !validateEth(store.eth_wallet_address)) return;
    setSaving(true);
    try {
      if (!hasStore) {
        await api.post('/stores', {
          name: store.name,
          description: store.description,
          logo_url: store.logo_url || null,
        });
        setHasStore(true);
      }

      await api.put('/stores/my', {
        name: store.name,
        description: store.description,
        logo_url: store.logo_url,
        shipping_methods: store.shipping_methods,
        crypto_enabled: store.crypto_enabled,
        eth_wallet_address: store.eth_wallet_address,
        eth_confirmations_required: store.required_confirmations,
      });
      toast.success('Configuración guardada');
      setLoadError('');
    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const addShippingMethod = () => {
    setStore((s) => ({
      ...s,
      shipping_methods: [...s.shipping_methods, { id: Date.now(), name: '', price: 0, estimated_days: '' }],
    }));
  };

  const updateShippingMethod = (id, field, value) => {
    setStore((s) => ({
      ...s,
      shipping_methods: s.shipping_methods.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  const removeShippingMethod = (id) => {
    setStore((s) => ({ ...s, shipping_methods: s.shipping_methods.filter((m) => m.id !== id) }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" className="text-gold dark:text-gold-light" /></div>;
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/40';
  const labelCls = 'block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-950 dark:text-white">Configuración</h1>
        <p className="text-sm text-charcoal-500 dark:text-zinc-400 mt-1">Administra los datos y preferencias de tu tienda</p>
      </div>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      )}

      {store.slug !== 'kingsley-caps-oficial' && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold-light">
          <p className="font-semibold text-white">Aprobacion y comision</p>
          <p className="mt-1">
            Tu tienda queda pendiente hasta que el administrador la apruebe. Mientras este pendiente, tus productos se guardan pero no aparecen en el catalogo publico.
          </p>
          <p className="mt-1">
            Kingsley retiene una comision del 10% sobre el subtotal de productos de cada orden; el resto se calcula como monto a liquidar al vendedor.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store info */}
        <section className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Información de la tienda</h2>
          <div>
            <label className={labelCls}>Nombre de la tienda</label>
            <input type="text" value={store.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Kingsley Caps GT" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              rows={3}
              value={store.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe tu tienda…"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>URL del logo</label>
            <input type="url" value={store.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://example.com/logo.png" className={inputCls} />
            {store.logo_url && (
              <img src={store.logo_url} alt="Logo preview" className="mt-2 h-12 w-12 object-contain rounded-lg border border-charcoal-100 dark:border-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
          </div>
        </section>

        {/* Crypto payments */}
        <section className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Pagos Crypto</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${store.crypto_enabled ? 'bg-gold' : 'bg-charcoal-200 dark:bg-charcoal-700'}`}
              onClick={() => set('crypto_enabled', !store.crypto_enabled)}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${store.crypto_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-charcoal-700 dark:text-zinc-300">
              {store.crypto_enabled ? 'Pagos crypto habilitados' : 'Pagos crypto deshabilitados'}
            </span>
          </label>

          {store.crypto_enabled && (
            <>
              <div>
                <label className={labelCls}>Dirección de wallet ETH</label>
                <input
                  type="text"
                  value={store.eth_wallet_address}
                  onChange={(e) => { set('eth_wallet_address', e.target.value); validateEth(e.target.value); }}
                  placeholder="0x..."
                  className={`${inputCls} font-mono ${ethError ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                {ethError && <p className="mt-1 text-xs text-red-500">{ethError}</p>}
              </div>
              <div>
                <label className={labelCls}>Confirmaciones requeridas</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={store.required_confirmations}
                  onChange={(e) => set('required_confirmations', Number(e.target.value))}
                  className={`${inputCls} w-32`}
                />
                <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">Número de confirmaciones en blockchain antes de aceptar el pago (recomendado: 3)</p>
              </div>
            </>
          )}
        </section>

        {/* Shipping methods */}
        <section className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Métodos de envío</h2>
            <button type="button" onClick={addShippingMethod} className="text-xs font-medium text-gold dark:text-gold-light hover:text-gold-dark dark:hover:text-gold-light transition-colors">
              + Agregar método
            </button>
          </div>

          {store.shipping_methods.length === 0 && (
            <p className="text-sm text-charcoal-400 dark:text-zinc-500">Sin métodos de envío configurados.</p>
          )}

          <div className="space-y-3">
            {store.shipping_methods.map((m) => (
              <div key={m.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-50 dark:bg-charcoal-800 rounded-lg">
                <input
                  type="text"
                  placeholder="Nombre del método"
                  value={m.name}
                  onChange={(e) => updateShippingMethod(m.id, 'name', e.target.value)}
                  className={inputCls}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-charcoal-400 dark:text-zinc-500">Q</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={m.price}
                    onChange={(e) => updateShippingMethod(m.id, 'price', Number(e.target.value))}
                    className={`${inputCls} pl-7`}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: 3-5 días"
                    value={m.estimated_days}
                    onChange={(e) => updateShippingMethod(m.id, 'estimated_days', e.target.value)}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeShippingMethod(m.id)}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-8 py-2.5 text-sm font-semibold bg-gold hover:bg-gold-dark text-white dark:bg-gold-light dark:text-charcoal-950 dark:hover:bg-gold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Spinner size="sm" /> : null}
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
