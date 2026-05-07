import { useState, useCallback } from 'react';
import api from '../services/api';

const MOCK_VARIANTS = [
  { id: 'v1', sku: 'CAP-BLK-M', product_name: 'Gorra Classic', size: 'M', color: 'Negro', stock: 2, low_stock_threshold: 5 },
  { id: 'v2', sku: 'CAP-WHT-L', product_name: 'Gorra Classic', size: 'L', color: 'Blanco', stock: 0, low_stock_threshold: 5 },
  { id: 'v3', sku: 'CAP-NAV-S', product_name: 'Gorra Elite', size: 'S', color: 'Navy', stock: 18, low_stock_threshold: 5 },
  { id: 'v4', sku: 'CAP-GRY-M', product_name: 'Gorra Elite', size: 'M', color: 'Gris', stock: 7, low_stock_threshold: 5 },
  { id: 'v5', sku: 'CAP-RED-XL', product_name: 'Gorra Sport', size: 'XL', color: 'Rojo', stock: 3, low_stock_threshold: 5 },
];

const MOCK_MOVEMENTS = [
  { id: 'm1', created_at: new Date(Date.now() - 3600000).toISOString(), sku: 'CAP-BLK-M', type: 'sale', quantity: -2, reason: 'Venta #ORD001', stock_after: 2 },
  { id: 'm2', created_at: new Date(Date.now() - 7200000).toISOString(), sku: 'CAP-WHT-L', type: 'sale', quantity: -1, reason: 'Venta #ORD002', stock_after: 0 },
  { id: 'm3', created_at: new Date(Date.now() - 86400000).toISOString(), sku: 'CAP-NAV-S', type: 'restock', quantity: 10, reason: 'Reabastecimiento proveedor', stock_after: 18 },
  { id: 'm4', created_at: new Date(Date.now() - 172800000).toISOString(), sku: 'CAP-GRY-M', type: 'adjustment', quantity: -1, reason: 'Ajuste inventario físico', stock_after: 7 },
];

export default function useInventory() {
  const [variants, setVariants] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/inventory/variants');
      setVariants(data.data.variants || data.data || []);
    } catch {
      setVariants(MOCK_VARIANTS);
      setError('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/inventory/alerts');
      setAlerts(data.data.alerts || data.data || []);
    } catch {
      setAlerts(MOCK_VARIANTS.filter((v) => v.stock <= v.low_stock_threshold));
    }
  }, []);

  const fetchMovements = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/inventory/movements?page=${page}&limit=${limit}`);
      setMovements(data.data.movements || data.data || []);
      if (data.meta) setPagination({ page: data.meta.page, total: data.meta.total, totalPages: data.meta.totalPages });
    } catch {
      setMovements(MOCK_MOVEMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustStock = useCallback(async (variantId, { quantity, type, reason }) => {
    const { data } = await api.put(`/api/inventory/variants/${variantId}/stock`, { quantity, type, reason });
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, stock: data.data.stockAfter ?? v.stock } : v))
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

  return { variants, alerts, movements, loading, error, pagination, fetchVariants, fetchAlerts, fetchMovements, adjustStock, exportCSV };
}
