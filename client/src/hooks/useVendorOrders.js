import { useState, useCallback } from 'react';
import api from '../services/api';

const MOCK_ORDERS = [
  { id: 'ord-0001-uuid', customer_name: 'Ana García', created_at: new Date(Date.now() - 3600000).toISOString(), total_fiat: 450, payment_method: 'crypto_eth', status: 'paid' },
  { id: 'ord-0002-uuid', customer_name: 'Luis Pérez', created_at: new Date(Date.now() - 86400000).toISOString(), total_fiat: 900, payment_method: 'card', status: 'preparing' },
  { id: 'ord-0003-uuid', customer_name: 'María López', created_at: new Date(Date.now() - 172800000).toISOString(), total_fiat: 225, payment_method: 'crypto_eth', status: 'shipped' },
  { id: 'ord-0004-uuid', customer_name: 'Carlos Ruiz', created_at: new Date(Date.now() - 259200000).toISOString(), total_fiat: 675, payment_method: 'card', status: 'delivered' },
  { id: 'ord-0005-uuid', customer_name: 'Sofia Chen', created_at: new Date(Date.now() - 345600000).toISOString(), total_fiat: 450, payment_method: 'crypto_eth', status: 'pending_payment' },
];

export default function useVendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchOrders = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/api/orders?${params.toString()}`);
      setOrders(data.data.orders || data.data || []);
      if (data.meta) setPagination({ page: data.meta.page, total: data.meta.total, totalPages: data.meta.totalPages });
    } catch {
      setOrders(MOCK_ORDERS);
      setError('mock');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    const { data } = await api.put(`/api/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    return data;
  }, []);

  const addTracking = useCallback(async (orderId, trackingData) => {
    const { data } = await api.put(`/api/shipping/orders/${orderId}/tracking`, trackingData);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'shipped', tracking: trackingData } : o)));
    return data;
  }, []);

  return { orders, loading, error, pagination, fetchOrders, updateOrderStatus, addTracking };
}
