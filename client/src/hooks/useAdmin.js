import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useAdmin() {
  const [stores, setStores] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/stores');
      setStores(data.data.stores || data.data || []);
    } catch (err) {
      setStores([]);
      setError(err.message || 'No se pudieron cargar las tiendas.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardMetrics = useCallback(async () => {
    setError(null);
    try {
      const [metricsRes, notifsRes] = await Promise.allSettled([
        api.get('/admin/metrics'),
        api.get('/notifications', { params: { type: 'payment_discrepancy', limit: 10 } }),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data.data);
      } else {
        setMetrics(null);
        setError(metricsRes.reason?.message || 'No se pudieron cargar las metricas.');
      }

      setDiscrepancies(
        notifsRes.status === 'fulfilled'
          ? (notifsRes.value.data.data.notifications || []).filter((n) => n.type === 'payment_discrepancy')
          : []
      );
    } catch (err) {
      setMetrics(null);
      setDiscrepancies([]);
      setError(err.message || 'No se pudo cargar el dashboard.');
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/admin/inventory');
      setInventory(data.data.inventory || []);
    } catch (err) {
      setInventory([]);
      setError(err.message || 'No se pudo cargar el inventario global.');
    }
  }, []);

  const approveStore = useCallback(async (id) => {
    await api.put(`/admin/stores/${id}/approve`);
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s)));
  }, []);

  const suspendStore = useCallback(async (id) => {
    await api.put(`/admin/stores/${id}/suspend`);
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'suspended' } : s)));
  }, []);

  const reactivateStore = useCallback(async (id) => {
    await api.put(`/admin/stores/${id}/reactivate`);
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'active' } : s)));
  }, []);

  const fetchProducts = useCallback(async (filters = {}) => {
    setError(null);
    try {
      const { data } = await api.get('/admin/products', { params: filters });
      setProducts(data.data.products || []);
    } catch (err) {
      setProducts([]);
      setError(err.message || 'No se pudieron cargar los productos.');
    }
  }, []);

  const activateProduct = useCallback(async (id) => {
    await api.put(`/admin/products/${id}/activate`);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p)));
  }, []);

  const deactivateProduct = useCallback(async (id) => {
    await api.put(`/admin/products/${id}/deactivate`);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'draft' } : p)));
  }, []);

  return {
    stores,
    metrics,
    inventory,
    discrepancies,
    products,
    loading,
    error,
    fetchStores,
    fetchDashboardMetrics,
    fetchInventory,
    approveStore,
    suspendStore,
    reactivateStore,
    fetchProducts,
    activateProduct,
    deactivateProduct,
  };
}
