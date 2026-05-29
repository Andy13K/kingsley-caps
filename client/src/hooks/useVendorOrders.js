import { useState, useCallback } from 'react';
import api from '../services/api';

const normalizeOrder = (order) => {
  const payments = order.payments ?? order.Payments ?? [];
  const transferPayment = payments.find((payment) => payment.method === 'transfer') ?? null;

  return {
    ...order,
    payments,
    customer_name: order.customer_name ?? order.customer?.name ?? order.customer?.email ?? 'Cliente',
    total_fiat: Number(order.total_fiat ?? order.total ?? 0),
    platform_fee_amount: Number(order.platform_fee_amount ?? 0),
    vendor_payout_amount: Number(order.vendor_payout_amount ?? 0),
    payment_method: order.payment_method ?? order.paymentMethod,
    created_at: order.created_at ?? order.createdAt,
    store_name: order.store_name ?? order.Store?.name ?? order.store?.name ?? 'Tienda',
    store_slug: order.store_slug ?? order.Store?.slug ?? order.store?.slug,
    transfer_payment_id: transferPayment?.id,
    transfer_payment_status: transferPayment?.status,
    transfer_proof_url: transferPayment?.transfer_proof_url ?? transferPayment?.transferProofUrl,
    transfer_reference: transferPayment?.transfer_reference ?? transferPayment?.transferReference,
    tracking: order.tracking ?? (order.tracking_number ? {
      tracking_number: order.tracking_number,
      carrier: order.tracking_company,
      shipping_proof_url: order.shipping_proof_url,
    } : null),
    items: order.items ?? [],
  };
};

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

  const addTracking = useCallback(async (orderId, trackingData) => {
    const formData = new FormData();
    formData.append('trackingNumber', trackingData.trackingNumber);
    formData.append('trackingCompany', trackingData.trackingCompany);
    if (trackingData.shippingProof) formData.append('shippingProof', trackingData.shippingProof);
    const { data } = await api.put(`/shipping/orders/${orderId}/tracking`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? {
      ...o,
      status: 'shipped',
      tracking: {
        tracking_number: trackingData.trackingNumber,
        carrier: trackingData.trackingCompany,
        shipping_proof_url: data.data.order?.shipping_proof_url,
      },
    } : o)));
    return data;
  }, []);

  const approveTransferPayment = useCallback(async ({ paymentId, orderId }) => {
    const { data } = await api.put(`/payments/transfer/${paymentId}/approve`);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? {
      ...o,
      status: 'paid',
      transfer_payment_status: 'confirmed',
    } : o)));
    return data;
  }, []);

  const rejectTransferPayment = useCallback(async ({ paymentId, orderId }) => {
    const { data } = await api.put(`/payments/transfer/${paymentId}/reject`);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? {
      ...o,
      transfer_payment_status: 'failed',
    } : o)));
    return data;
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    updateOrderStatus,
    addTracking,
    approveTransferPayment,
    rejectTransferPayment,
  };
}
