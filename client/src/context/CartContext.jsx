import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const CartContext = createContext(null);

const normalizeCartItem = (item) => {
  const variant = item.ProductVariant ?? item.productVariant ?? {};
  const product = variant.Product ?? variant.product ?? {};
  const store = product.Store ?? product.store ?? variant.Store ?? variant.store ?? {};
  return {
    cartItemId: item.id,
    variantId: item.productVariantId ?? item.product_variant_id ?? variant.id,
    productId: product.id ?? variant.product_id,
    storeId: product.store_id ?? product.storeId ?? variant.store_id ?? variant.storeId,
    storeName: store.name ?? product.storeName ?? product.store_name ?? item.storeName ?? item.store_name ?? 'Tienda',
    storeSlug: store.slug ?? product.storeSlug ?? product.store_slug ?? item.storeSlug ?? item.store_slug,
    name: product.name ?? 'Producto',
    size: variant.size,
    color: variant.color,
    price: Number(item.unitPrice ?? item.unit_price ?? variant.price_override ?? product.base_price ?? 0),
    stock: Number(variant.stock ?? 0),
    image: product.images?.[0] ?? null,
    quantity: Number(item.quantity ?? 1),
  };
};

export function CartProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const syncCart = useCallback(async (storeId) => {
    if (!isAuthenticated) {
      setItems([]);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/cart', { params: storeId ? { storeId } : {} });
      const synced = (data.data.items ?? []).map(normalizeCartItem);
      setItems(synced);
      return synced;
    } catch (err) {
      setItems([]);
      setError(err.message || 'No se pudo cargar el carrito.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      syncCart().catch(() => {});
    } else {
      setItems([]);
    }
  }, [isAuthenticated, syncCart]);

  const addItem = useCallback(async (product, variant, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesion para agregar productos al carrito.');
    }

    const storeId = product.store_id ?? product.storeId ?? variant.store_id ?? variant.storeId;
    const store = product.Store ?? product.store ?? variant.Store ?? variant.store ?? {};
    const storeName = store.name ?? product.storeName ?? product.store_name ?? 'Tienda';
    const storeSlug = store.slug ?? product.storeSlug ?? product.store_slug;
    if (!storeId) {
      throw new Error('El producto no tiene tienda asociada.');
    }

    setError(null);
    const { data } = await api.post('/cart/items', {
      storeId,
      productVariantId: variant.id,
      quantity,
    });

    const cartItemId = data.data.id;
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id
            ? { ...i, cartItemId: i.cartItemId ?? cartItemId, quantity: Math.min(i.quantity + quantity, variant.stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          variantId: variant.id,
          productId: product.id,
          storeId,
          storeName,
          storeSlug,
          name: product.name,
          size: variant.size,
          color: variant.color,
          price: variant.price_override ?? product.base_price,
          stock: variant.stock,
          image: product.images?.[0] ?? null,
          quantity,
        },
      ];
    });
  }, [isAuthenticated]);

  const removeItem = useCallback(async (variantId) => {
    const existing = items.find((i) => i.variantId === variantId);
    if (!existing?.cartItemId) return;

    setError(null);
    await api.delete(`/cart/items/${existing.cartItemId}`);
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, [items]);

  const updateQuantity = useCallback(async (variantId, quantity) => {
    if (quantity < 1) return;
    const existing = items.find((i) => i.variantId === variantId);
    if (!existing?.cartItemId) return;

    const nextQuantity = Math.min(quantity, existing.stock);
    setError(null);
    await api.put(`/cart/items/${existing.cartItemId}`, { quantity: nextQuantity });
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity: nextQuantity } : i))
    );
  }, [items]);

  const clearCart = useCallback(async () => {
    setError(null);
    await api.delete('/cart');
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, count, loading, error, addItem, removeItem, updateQuantity, clearCart, syncCart }}>
      {children}
    </CartContext.Provider>
  );
}
