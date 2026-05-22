import { useState, useCallback } from 'react';
import api from '../services/api';

const normalizeVariant = (variant) => ({
  ...variant,
  product_name: variant.product_name ?? variant.Product?.name ?? variant.product?.name ?? '',
});

export default function useInventory() {
  const [variants, setVariants] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [demandPredictions, setDemandPredictions] = useState(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [predictionsError, setPredictionsError] = useState(null);

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/inventory/variants');
      const rows = Array.isArray(data.data) ? data.data : data.data.variants ?? [];
      setVariants(rows.map(normalizeVariant));
    } catch (err) {
      setVariants([]);
      setError(err.message || 'No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory/alerts');
      const rows = Array.isArray(data.data) ? data.data : data.data.alerts ?? [];
      setAlerts(rows.map(normalizeVariant));
    } catch {
      setAlerts([]);
    }
  }, []);

  const fetchMovements = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory/movements?page=${page}&limit=${limit}`);
      const rows = Array.isArray(data.data) ? data.data : data.data.movements ?? [];
      setMovements(rows);
      if (data.meta) setPagination({ page: data.meta.page, total: data.meta.total, totalPages: data.meta.totalPages });
    } catch (err) {
      setMovements([]);
      setError(err.message || 'No se pudieron cargar los movimientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustStock = useCallback(async (variantId, { quantity, type, reason }) => {
    const { data } = await api.put(`/inventory/variants/${variantId}/stock`, { quantity, type, reason });
    const updated = data.data.variant ?? data.data;
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? normalizeVariant({ ...v, ...updated }) : v))
    );
    return data;
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['SKU', 'Producto', 'Talla', 'Color', 'Stock', 'Umbral'];
    const rows = variants.map((v) => [v.sku, v.product_name, v.size, v.color, v.stock, v.low_stock_threshold]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [variants]);

  const fetchDemandPredictions = useCallback(async () => {
    setIsLoadingPredictions(true);
    setPredictionsError(null);
    try {
      const { data } = await api.get('/inventory/demand-predictions');
      setDemandPredictions(data.data);
    } catch (err) {
      setPredictionsError(err.message || 'No se pudieron cargar las predicciones.');
    } finally {
      setIsLoadingPredictions(false);
    }
  }, []);

  return {
    variants, alerts, movements, loading, error, pagination,
    fetchVariants, fetchAlerts, fetchMovements, adjustStock, exportCSV,
    demandPredictions, isLoadingPredictions, predictionsError, fetchDemandPredictions,
  };
}
