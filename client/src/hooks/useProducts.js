import { useState, useEffect } from 'react';
import api from '../services/api';

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/products', { params: filters })
      .then((res) => {
        const rows = Array.isArray(res.data.data) ? res.data.data : res.data.data.products ?? [];
        setProducts(rows);
      })
      .catch((err) => {
        setProducts([]);
        setError(err.message || 'No se pudieron cargar los productos.');
      })
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { products, loading, error };
};

export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.get(`/products/${id}`)
      .then((res) => setProduct(res.data.data.product ?? res.data.data))
      .catch((err) => {
        setProduct(null);
        setError(err.message || 'Producto no encontrado');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading, error };
};
