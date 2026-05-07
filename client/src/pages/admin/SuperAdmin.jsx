import { useEffect } from 'react';
import toast from 'react-hot-toast';
import useAdmin from '../../hooks/useAdmin';
import Spinner from '../../components/ui/Spinner';

function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

const STATUS_COLOR = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const STATUS_LABEL = { active: 'Activa', draft: 'Pendiente', suspended: 'Suspendida' };
const PLAN_COLOR = {
  pro: 'bg-gold/15 text-gold',
  basic: 'bg-zinc-100 text-zinc-600 dark:bg-charcoal-800 dark:text-zinc-400',
};

export default function SuperAdmin() {
  const { stores, metrics, discrepancies, loading, fetchStores, fetchDashboardMetrics, approveStore, suspendStore } = useAdmin();

  useEffect(() => {
    fetchStores();
    fetchDashboardMetrics();
  }, [fetchStores, fetchDashboardMetrics]);

  const handleApprove = async (id, name) => {
    try {
      await approveStore(id);
      toast.success(`Tienda "${name}" aprobada`);
    } catch {
      toast.error('Error al aprobar tienda');
    }
  };

  const handleSuspend = async (id, name) => {
    try {
      await suspendStore(id);
      toast.success(`Tienda "${name}" suspendida`);
    } catch {
      toast.error('Error al suspender tienda');
    }
  };

  const pendingStores = stores.filter((s) => s.status === 'draft');
  const activeStores = stores.filter((s) => s.status !== 'draft');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-charcoal-950 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-950 dark:text-white">Panel SuperAdmin</h1>
        <p className="text-sm text-charcoal-500 dark:text-zinc-400 mt-1">Vista global de la plataforma Kingsley Caps</p>
      </div>

      {/* Global metrics */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total tiendas', value: metrics.totalStores, sub: `${metrics.activeStores} activas`, color: 'text-gold' },
            { label: 'Usuarios registrados', value: metrics.totalUsers, sub: 'en la plataforma', color: 'text-charcoal-950 dark:text-white' },
            { label: 'Ventas totales', value: `Q${(metrics.totalSalesGtq || 0).toLocaleString('es-GT')}`, sub: 'GTQ acumulado', color: 'text-gold' },
            { label: 'Ventas en ETH', value: `${metrics.totalSalesEth || '0'} ETH`, sub: 'crypto recibido', color: 'text-charcoal-950 dark:text-white' },
          ].map((m) => (
            <div key={m.label} className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 shadow-sm">
              <p className="text-xs font-medium text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide">{m.label}</p>
              <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
              <p className="text-xs text-charcoal-400 dark:text-zinc-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending stores */}
      <section className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-charcoal-100 dark:border-white/10 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Tiendas pendientes de aprobación</h2>
          {pendingStores.length > 0 && (
            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full">
              {pendingStores.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" className="text-gold" /></div>
        ) : pendingStores.length === 0 ? (
          <p className="text-center py-8 text-sm text-charcoal-400 dark:text-zinc-500">Sin tiendas pendientes ✓</p>
        ) : (
          <div className="divide-y divide-charcoal-50 dark:divide-white/5">
            {pendingStores.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-charcoal-500 dark:text-zinc-400 mt-0.5">
                    {s.vendor_name} · {new Date(s.created_at).toLocaleDateString('es-GT')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(s.id, s.name)}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleSuspend(s.id, s.name)}
                    className="px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-charcoal-800 hover:bg-zinc-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-zinc-300 rounded-lg transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active stores */}
      <section className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-charcoal-100 dark:border-white/10">
          <h2 className="text-sm font-semibold text-charcoal-950 dark:text-white">Tiendas activas</h2>
        </div>
        {activeStores.length === 0 ? (
          <p className="text-center py-8 text-sm text-charcoal-400 dark:text-zinc-500">Sin tiendas activas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 dark:border-white/10">
                  {['Tienda', 'Vendedor', 'Plan', 'Estado', 'Creada', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-50 dark:divide-white/5">
                {activeStores.map((s) => (
                  <tr key={s.id} className="hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-charcoal-900 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-charcoal-600 dark:text-zinc-400">{s.vendor_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${PLAN_COLOR[s.plan] || 'bg-zinc-100 text-zinc-600'}`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status] || ''}`}>
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-4 py-3">
                      {s.status !== 'suspended' && (
                        <button
                          onClick={() => handleSuspend(s.id, s.name)}
                          className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                        >
                          Suspender
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Fraud alerts */}
      <section className="bg-white dark:bg-charcoal-900 rounded-xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/20 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Alertas de discrepancia</h2>
          {discrepancies.length > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
              {discrepancies.length}
            </span>
          )}
        </div>
        {discrepancies.length === 0 ? (
          <p className="text-center py-8 text-sm text-charcoal-400 dark:text-zinc-500">Sin alertas de discrepancia ✓</p>
        ) : (
          <div className="divide-y divide-red-50 dark:divide-red-900/10">
            {discrepancies.map((n) => (
              <div key={n.id} className="px-5 py-4 flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-charcoal-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-charcoal-400 dark:text-zinc-500 mt-1">{relativeTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
