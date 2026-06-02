import { useState, useCallback } from 'react';
import api from '../services/api';

const normalizeOrder = (order) => ({
  ...order,
  customer_name: order.customer_name ?? order.customer?.name ?? order.customer?.email ?? 'Cliente',
  total_fiat: Number(order.total_fiat ?? order.total ?? 0),
  platform_fee_amount: Number(order.platform_fee_amount ?? 0),
  vendor_payout_amount: Number(order.vendor_payout_amount ?? 0),
  payment_method: order.payment_method ?? order.paymentMethod,
  created_at: order.created_at ?? order.createdAt,
  tracking: order.tracking ?? (order.tracking_number ? {
    tracking_number: order.tracking_number,
    carrier: order.tracking_company,
  } : null),
  items: order.items ?? [],
});

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
      const { data } = await api.get(`/orders?${params.toString()}`);
      const rows = Array.isArray(data.data) ? data.data : data.data.orders ?? [];
      setOrders(rows.map(normalizeOrder));
      if (data.meta) setPagination({ page: data.meta.page, total: data.meta.total, totalPages: data.meta.totalPages });
    } catch (err) {
      setOrders([]);
      setError(err.message || 'No se pudieron cargar las ordenes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    const { data } = await api.put(`/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    return data;
  }, []);

  const addTracking = useCallback(async (orderId, formData) => {
    const isFormData = formData instanceof FormData;
    const { data } = await api.put(`/shipping/orders/${orderId}/tracking`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    const trackingNumber = isFormData ? formData.get('trackingNumber') : formData.trackingNumber;
    const trackingCompany = isFormData ? formData.get('trackingCompany') : formData.trackingCompany;
    const trackingImage = data?.data?.order?.tracking_image ?? null;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? {
      ...o,
      status: 'shipped',
      tracking: { tracking_number: trackingNumber, carrier: trackingCompany, tracking_image: trackingImage },
    } : o)));
    return data;
  }, []);

  return { orders, loading, error, pagination, fetchOrders, updateOrderStatus, addTracking };
}
