import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const normalizeOrder = (order) => ({
  ...order,
  paymentMethod: order.paymentMethod ?? order.payment_method,
  createdAt: order.createdAt ?? order.created_at,
  paidAt: order.paidAt ?? order.paid_at,
  deliveredAt: order.deliveredAt ?? order.delivered_at,
  shippingAddress: order.shippingAddress ?? order.shipping_address ?? {},
  trackingNumber: order.trackingNumber ?? order.tracking_number,
  trackingCompany: order.trackingCompany ?? order.tracking_company,
  items: (order.items ?? []).map((item) => ({
    ...item,
    productName: item.productName ?? item.product_name,
    variantSize: item.variantSize ?? item.variant_size,
    variantColor: item.variantColor ?? item.variant_color,
    unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
    subtotal: Number(item.subtotal ?? 0),
  })),
  total: Number(order.total ?? 0),
});

export const useOrders = (page = 1, limit = 10) => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/orders', { params: { page, limit } });
      const rows = Array.isArray(data.data) ? data.data : data.data.orders ?? [];
      setOrders(rows.map(normalizeOrder));
      setTotal(data.meta?.total ?? rows.length);
    } catch (err) {
      setOrders([]);
      setTotal(0);
      setError(err.message || 'No se pudieron cargar tus ordenes.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, loading, error, refetch: fetchOrders };
};
