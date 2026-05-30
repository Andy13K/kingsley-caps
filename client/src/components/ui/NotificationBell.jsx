import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.data.count);
    } catch {
      // fail silently — show bell without badge
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-charcoal-800 dark:text-zinc-300 hover:text-charcoal-950 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gold text-white dark:bg-gold-light dark:text-charcoal-950 text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-charcoal-900 rounded-xl shadow-xl border border-charcoal-100 dark:border-white/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal-100 dark:border-white/10">
            <span className="font-semibold text-sm text-charcoal-950 dark:text-white">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-gold dark:text-gold-light hover:text-gold-dark dark:hover:text-gold-light font-medium transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-charcoal-50 dark:divide-white/5">
            {loading ? (
              <p className="py-8 text-center text-sm text-charcoal-400 dark:text-zinc-500">Cargando...</p>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-charcoal-400 dark:text-zinc-500">Sin notificaciones</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors ${!n.read ? 'bg-cream/40 dark:bg-blue-950/10' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-gold' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">{n.title}</p>
                    <p className="text-xs text-charcoal-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-charcoal-400 dark:text-zinc-500 mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
