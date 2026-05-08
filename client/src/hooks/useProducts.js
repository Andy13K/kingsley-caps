import { useState, useEffect } from 'react';
import api from '../services/api';

// Imágenes placehold.co: fondo del color principal de la gorra, sin texto
// Aporta una estética de fotografía de producto sobre fondo sólido
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Visera Plana Clásica',
    description: 'Corte estructurado, visera plana y cierre trasero ajustable. Diseñada para quien no negocia el estilo.',
    base_price: 150.00,
    category: 'Visera Plana',
    status: 'active',
    featured: true,
    images: ['https://placehold.co/480x600/111110/f5f3ef?text=Visera+Plana+Clasica'],
    variants: [
      { id: 'v1', size: 'S',  color: 'Negro', sku: 'SN-BLK-S', stock: 15, price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v2', size: 'M',  color: 'Negro', sku: 'SN-BLK-M', stock: 2,  price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v3', size: 'L',  color: 'Negro', sku: 'SN-BLK-L', stock: 0,  price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v4', size: 'M',  color: 'Blanco',sku: 'SN-WHT-M', stock: 10, price_override: 160.00, low_stock_threshold: 3, active: true },
    ],
  },
  {
    id: '2',
    name: 'Camionera de Malla',
    description: 'Panel de malla transpirable y frente estructurado. El clásico que nunca falla en días calurosos.',
    base_price: 120.00,
    category: 'Camionera',
    status: 'active',
    featured: true,
    images: ['https://placehold.co/480x600/1e3a5f/f5f3ef?text=Camionera+de+Malla'],
    variants: [
      { id: 'v5', size: 'M', color: 'Azul marino', sku: 'TR-NAV-M', stock: 8, price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v6', size: 'L', color: 'Azul marino', sku: 'TR-NAV-L', stock: 5, price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v7', size: 'M', color: 'Rojo',        sku: 'TR-RED-M', stock: 3, price_override: 130.00, low_stock_threshold: 3, active: true },
    ],
  },
  {
    id: '3',
    name: 'Gorro de Lana Urbano',
    description: 'Lana merino con doble capa. Abrigo real para noches frías sin sacrificar el look.',
    base_price: 95.00,
    category: 'Gorro',
    status: 'active',
    featured: false,
    images: ['https://placehold.co/480x600/787878/f5f3ef?text=Gorro+de+Lana+Urbano'],
    variants: [
      { id: 'v8', size: 'Talla única', color: 'Gris jaspeado', sku: 'BN-GRY-U', stock: 20, price_override: null, low_stock_threshold: 5, active: true },
      { id: 'v9', size: 'Talla única', color: 'Negro',         sku: 'BN-BLK-U', stock: 1,  price_override: null, low_stock_threshold: 5, active: true },
    ],
  },
  {
    id: '4',
    name: 'Cerrada Sin Hebilla',
    description: 'Ajuste cerrado sin hebilla trasera. Para quienes prefieren que cada detalle sea intencional.',
    base_price: 180.00,
    category: 'Cerrada',
    status: 'active',
    featured: true,
    images: ['https://placehold.co/480x600/4d5e3a/f5f3ef?text=Cerrada+Sin+Hebilla'],
    variants: [
      { id: 'v10', size: '7',   color: 'Oliva',    sku: 'FT-OLV-7',  stock: 12, price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v11', size: '7¼',  color: 'Oliva',    sku: 'FT-OLV-72', stock: 6,  price_override: null,   low_stock_threshold: 3, active: true },
      { id: 'v12', size: '7',   color: 'Caramelo', sku: 'FT-CRM-7',  stock: 4,  price_override: 195.00, low_stock_threshold: 3, active: true },
    ],
  },
  {
    id: '5',
    name: 'Gorra Papá Stonewash',
    description: 'Visera curva, frente no estructurado y lavado stonewash. El relax hecho gorra.',
    base_price: 110.00,
    category: 'Visera Plana',
    status: 'active',
    featured: true,
    images: ['https://placehold.co/480x600/c4a87a/111110?text=Gorra+Papa+Stonewash'],
    variants: [
      { id: 'v13', size: 'Ajustable', color: 'Arena',   sku: 'DC-SND-A', stock: 18, price_override: null,   low_stock_threshold: 4, active: true },
      { id: 'v14', size: 'Ajustable', color: 'Lavanda', sku: 'DC-LAV-A', stock: 7,  price_override: 115.00, low_stock_threshold: 4, active: true },
    ],
  },
  {
    id: '6',
    name: 'Cubeta Reversible',
    description: 'Ala ancha, dos capas reversibles. Una gorra, dos estilos distintos para cada salida.',
    base_price: 135.00,
    category: 'Cubeta',
    status: 'active',
    featured: false,
    images: ['https://placehold.co/480x600/2c2c2c/f5f3ef?text=Cubeta+Reversible'],
    variants: [
      { id: 'v15', size: 'S/M',  color: 'Negro/Blanco', sku: 'BK-BW-SM', stock: 9, price_override: null, low_stock_threshold: 3, active: true },
      { id: 'v16', size: 'L/XL', color: 'Negro/Blanco', sku: 'BK-BW-LX', stock: 5, price_override: null, low_stock_threshold: 3, active: true },
    ],
  },
];

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/products', { params: filters })
      .then((res) => setProducts(res.data.data.products))
      .catch(() => {
        let result = MOCK_PRODUCTS;
        if (filters.featured) result = result.filter((p) => p.featured);
        if (filters.category) result = result.filter((p) => p.category === filters.category);
        if (filters.search) {
          const q = filters.search.toLowerCase();
          result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        setProducts(result);
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
      .then((res) => setProduct(res.data.data.product))
      .catch(() => {
        const mock = MOCK_PRODUCTS.find((p) => p.id === id);
        if (mock) setProduct(mock);
        else setError('Producto no encontrado');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading, error };
};
