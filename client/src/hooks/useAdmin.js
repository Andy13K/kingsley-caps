import { useState, useCallback } from 'react';
import api from '../services/api';

const MOCK_STORES = [
  { id: 's1', name: 'Gorras Urbanas GT', vendor_name: 'Pedro Alvarado', plan: 'pro', status: 'active', created_at: '2024-10-15T00:00:00Z' },
  { id: 's2', name: 'Style Caps', vendor_name: 'Mónica Fuentes', plan: 'basic', status: 'draft', created_at: '2025-01-20T00:00:00Z' },
  { id: 's3', name: 'Elite Headwear', vendor_name: 'Roberto Castillo', plan: 'pro', status: 'active', created_at: '2024-08-05T00:00:00Z' },
  { id: 's4', name: 'Cap Universe', vendor_name: 'Diana Torres', plan: 'basic', status: 'draft', created_at: '2025-03-01T00:00:00Z' },
];

const MOCK_METRICS = { totalStores: 4, activeStores: 2, totalUsers: 148, totalSalesGtq: 184500, totalSalesEth: '12.4' };

const MOCK_DISCREPANCIES = [
  { id: 'n1', title: 'ERR-C06: Discrepancia de monto', message: 'Pago PAY-001 con discrepancia. Orden: #ORD001A.', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n2', title: 'ERR-C06: Discrepancia de monto', message: 'Pago PAY-003 con discrepancia. Orden: #ORD003C.', created_at: new Date(Date.now() - 86400000).toISOString() },
];

export default function useAdmin() {
  const [stores, setStores] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/stores');
      setStores(data.data.stores || data.data || []);
    } catch {
      setStores(MOCK_STORES);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      const [metricsRes, notifsRes] = await Promise.allSettled([
        api.get('/api/admin/metrics'),
        api.get('/api/notifications?type=payment_discrepancy&limit=10'),
      ]);
      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value.data.data : MOCK_METRICS);
      setDiscrepancies(notifsRes.status === 'fulfilled' ? (notifsRes.value.data.data.notifications || []) : MOCK_DISCREPANCIES);
    } catch {
      setMetrics(MOCK_METRICS);
      setDiscrepancies(MOCK_DISCREPANCIES);
    }
  }, []);

  const approveStore = useCallback(async (id) => {
    await api.put(`/api/admin/stores/${id}/approve`);
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s)));
  }, []);

  const suspendStore = useCallback(async (id) => {
    await api.put(`/api/admin/stores/${id}/suspend`);
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'suspended' } : s)));
  }, []);

  return { stores, metrics, discrepancies, loading, fetchStores, fetchDashboardMetrics, approveStore, suspendStore };
}
