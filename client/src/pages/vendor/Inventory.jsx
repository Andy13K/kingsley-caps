import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import useInventory from '../../hooks/useInventory';
import Spinner from '../../components/ui/Spinner';

function stockStatus(stock, threshold) {
  if (stock === 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  if (stock <= threshold) return { label: 'Stock bajo', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
  return { label: 'Normal', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
}

function MovementBadge({ type }) {
  const styles = {
    sale: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    restock: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    adjustment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    return: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };
  const labels = { sale: 'Venta', restock: 'Reabastecimiento', adjustment: 'Ajuste', return: 'Devolución' };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[type] || 'bg-zinc-100 text-zinc-600'}`}>
      {labels[type] || type}
    </span>
  );
}

export default function VendorInventory() {
  const { variants, movements, loading, fetchVariants, fetchMovements, adjustStock, exportCSV } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ type: 'restock', quantity: 1, reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [movPage, setMovPage] = useState(1);

  useEffect(() => { fetchVariants(); fetchMovements(1); }, [fetchVariants, fetchMovements]);

  const openModal = (variant) => { setSelected(variant); setForm({ type: 'restock', quantity: 1, reason: '' }); setModalOpen(true); };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) { toast.error('El motivo es requerido'); return; }
    setSubmitting(true);
    try {
      await adjustStock(selected.id, { quantity: Number(form.quantity), type: form.type, reason: form.reason });
      toast.success('Stock ajustado correctamente');
      setModalOpen(false);
    } catch {
      toast.error('Error al ajustar stock');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = variants.filter((v) => {
    const matchSearch = search === '' || v.sku.toLowerCase().includes(search.toLowerCase()) || (v.product_name || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'low') return v.stock > 0 && v.stock <= v.low_stock_threshold;
    if (statusFilter === 'out') return v.stock === 0;
    return true;
  });

  const loadMoreMovements = () => { const next = movPage + 1; setMovPage(next); fetchMovements(next); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-950 dark:text-white">Inventario</h1>
          <p className="text-sm text-charcoal-500 dark:text-zinc-400 mt-1">{variants.length} variantes registradas</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-charcoal-900 dark:bg-charcoal-800 text-white rounded-lg hover:bg-charcoal-800 dark:hover:bg-charcoal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por SKU o producto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          <option value="all">Todos los estados</option>
          <option value="low">Stock bajo</option>
          <option value="out">Sin stock</option>
        </select>
      </div>

      {/* Variants table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-gold" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-charcoal-400 dark:text-zinc-500">Sin variantes encontradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-white/10">
                  {['SKU', 'Producto', 'Talla', 'Color', 'Stock', 'Umbral', 'Estado', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-50 dark:divide-white/5">
                {filtered.map((v) => {
                  const st = stockStatus(v.stock, v.low_stock_threshold);
                  return (
                    <tr key={v.id} className="hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-charcoal-900 dark:text-white">{v.sku}</td>
                      <td className="px-4 py-3 text-charcoal-800 dark:text-zinc-200">{v.product_name || '—'}</td>
                      <td className="px-4 py-3 text-charcoal-600 dark:text-zinc-400">{v.size || '—'}</td>
                      <td className="px-4 py-3 text-charcoal-600 dark:text-zinc-400">{v.color || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-charcoal-900 dark:text-white">{v.stock}</td>
                      <td className="px-4 py-3 text-charcoal-500 dark:text-zinc-500">{v.low_stock_threshold}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal(v)}
                          className="text-xs font-medium text-gold hover:text-gold-dark transition-colors"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movements */}
      <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-charcoal-100 dark:border-white/10">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Historial de movimientos</h2>
        </div>
        {movements.length === 0 ? (
          <p className="text-center py-8 text-sm text-charcoal-400 dark:text-zinc-500">Sin movimientos registrados</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-100 dark:border-white/10">
                    {['Fecha', 'SKU', 'Tipo', 'Cantidad', 'Motivo', 'Stock resultante'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-50 dark:divide-white/5">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-xs text-charcoal-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-charcoal-900 dark:text-white">{m.sku}</td>
                      <td className="px-4 py-3"><MovementBadge type={m.type} /></td>
                      <td className={`px-4 py-3 font-semibold ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-4 py-3 text-charcoal-600 dark:text-zinc-400 max-w-[200px] truncate">{m.reason}</td>
                      <td className="px-4 py-3 text-charcoal-800 dark:text-zinc-200">{m.stock_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-charcoal-100 dark:border-white/10">
              <button onClick={loadMoreMovements} className="text-xs text-gold hover:text-gold-dark font-medium transition-colors">
                Cargar más →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Adjust stock modal */}
      <Transition show={modalOpen} as={Fragment}>
        <Dialog onClose={() => setModalOpen(false)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl p-6">
                <Dialog.Title className="text-base font-semibold text-charcoal-950 dark:text-white mb-1">
                  Ajustar stock
                </Dialog.Title>
                {selected && (
                  <p className="text-sm text-charcoal-500 dark:text-zinc-400 mb-5">
                    {selected.sku} — Stock actual: <strong className="text-charcoal-900 dark:text-white">{selected.stock}</strong>
                  </p>
                )}
                <form onSubmit={handleAdjust} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Tipo de movimiento</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                    >
                      <option value="restock">Entrada (reabastecimiento)</option>
                      <option value="adjustment">Salida (ajuste)</option>
                      <option value="return">Devolución</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 dark:text-zinc-300 mb-1">Motivo <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      placeholder="Ej: Reabastecimiento proveedor"
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-white/10 rounded-lg text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 text-sm font-medium bg-zinc-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-charcoal-700 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm font-semibold bg-gold hover:bg-gold-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <Spinner size="sm" /> : null}
                      Confirmar
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
