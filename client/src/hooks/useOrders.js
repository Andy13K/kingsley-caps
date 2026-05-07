import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const MOCK_ORDERS = [
  {
    id: 'ord-001',
    status: 'delivered',
    total: 270.00,
    currency: 'GTQ',
    paymentMethod: 'crypto_eth',
    createdAt: '2026-04-15T10:30:00Z',
    paidAt: '2026-04-15T10:35:00Z',
    deliveredAt: '2026-04-18T14:00:00Z',
    shippingAddress: { name: 'Juan García', address: '3ra Calle 5-23, Zona 1', city: 'Puerto Barrios, Izabal' },
    trackingNumber: 'GT123456789',
    trackingCompany: 'DHL',
    items: [
      { productName: 'Snapback Classic', variantSize: 'M', variantColor: 'Negro', quantity: 1, unitPrice: 150.00, subtotal: 150.00 },
      { productName: 'Trucker Premium', variantSize: 'L', variantColor: 'Azul', quantity: 1, unitPrice: 120.00, subtotal: 120.00 },
    ],
  },
  {
    id: 'ord-002',
    status: 'preparing',
    total: 160.00,
    currency: 'GTQ',
    paymentMethod: 'card',
    createdAt: '2026-05-01T14:20:00Z',
    paidAt: '2026-05-01T14:22:00Z',
    shippingAddress: { name: 'Juan García', address: '3ra Calle 5-23, Zona 1', city: 'Puerto Barrios, Izabal' },
    trackingNumber: null,
    trackingCompany: null,
    items: [
      { productName: 'Snapback Classic', variantSize: 'S', variantColor: 'Blanco', quantity: 1, unitPrice: 160.00, subtotal: 160.00 },
    ],
  },
  {
    id: 'ord-003',
    status: 'pending_payment',
    total: 95.00,
    currency: 'GTQ',
    paymentMethod: 'transfer',
    createdAt: '2026-05-05T09:15:00Z',
    paidAt: null,
    shippingAddress: { name: 'Juan García', address: '3ra Calle 5-23, Zona 1', city: 'Puerto Barrios, Izabal' },
    trackingNumber: null,
    trackingCompany: null,
    items: [
      { productName: 'Beanie Invierno', variantSize: 'S', variantColor: 'Gris', quantity: 1, unitPrice: 95.00, subtotal: 95.00 },
    ],
  },
];

export const useOrders = (page = 1, limit = 10) => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/orders/my', { params: { page, limit } });
      setOrders(data.data.orders);
      setTotal(data.data.total);
    } catch {
      setOrders(MOCK_ORDERS);
      setTotal(MOCK_ORDERS.length);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, loading, error, refetch: fetchOrders };
};
