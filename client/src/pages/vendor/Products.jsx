import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner.jsx';
import api from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';

const STATUS_LABEL = { draft: 'Borrador', active: 'Activo', archived: 'Archivado' };
const STATUS_COLOR = {
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const DEFAULT_VARIANT = { size: 'M', color: 'Negro', sku: '', stock: 0 };
const EMPTY_FORM = {
  name: '',
  description: '',
  basePrice: '',
  category: 'Streetwear',
  images: [],
  variants: [DEFAULT_VARIANT],
};

const CONFIDENCE_CLASSES = {
  80: 'w-4/5 bg-green-500',
  60: 'w-3/5 bg-green-500',
  30: 'w-[30%] bg-yellow-500',
  0: 'w-0 bg-red-400',
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  const buildSku = (productIndex, variantIndex) =>
    `KC-${String(productIndex + 1).padStart(4, '0')}-${String(variantIndex + 1).padStart(2, '0')}`;

  const nextProductIndex = useMemo(() => products.length, [products.length]);

  const formWithSkus = (baseForm, productIndex = nextProductIndex) => ({
    ...baseForm,
    variants: baseForm.variants.map((variant, index) => ({
      ...variant,
      sku: variant.sku || buildSku(productIndex, index),
    })),
  });

  const resetForm = () => {
    setEditingProduct(null);
    setForm(formWithSkus(EMPTY_FORM));
    setImageFiles([]);
    setImagePreviews([]);
    setPriceSuggestion(null);
    setSuggestionError(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, storeRes] = await Promise.allSettled([
        api.get('/products/vendor/mine', { params: { limit: 50 } }),
        api.get('/stores/my'),
      ]);
      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value.data.data || []);
      }
      if (storeRes.status === 'fulfilled') {
        setStore(storeRes.value.data.data);
      }
      if (productsRes.status === 'rejected') {
        toast.error(productsRes.reason.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showForm && !editingProduct) {
      setForm(formWithSkus(EMPTY_FORM));
    }
  }, [nextProductIndex, showForm, editingProduct]);

  const totalStock = useMemo(
    () => (product) =>
      (product.variants || []).reduce((sum, v) => sum + Number(v.stock || 0), 0),
    []
  );

  const openNewProduct = () => {
    setShowForm(true);
    setEditingProduct(null);
    setForm(formWithSkus(EMPTY_FORM));
    setImageFiles([]);
    setImagePreviews([]);
  };

  const openEditProduct = (product) => {
    const productIndex = products.findIndex((p) => p.id === product.id);
    setShowForm(true);
    setEditingProduct(product);
    setForm(formWithSkus({
      name: product.name || '',
      description: product.description || '',
      basePrice: product.basePrice ?? product.base_price ?? '',
      category: product.category || 'Streetwear',
      images: product.images || [],
      variants: (product.variants?.length ? product.variants : [DEFAULT_VARIANT]).map((v) => ({
        id: v.id,
        size: v.size || 'M',
        color: v.color || 'Negro',
        sku: v.sku || '',
        stock: Number(v.stock || 0),
        active: v.active ?? true,
      })),
    }, productIndex >= 0 ? productIndex : nextProductIndex));
    setImageFiles([]);
    setImagePreviews(product.images || []);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleAddVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { ...DEFAULT_VARIANT, sku: buildSku(editingProduct ? products.findIndex((p) => p.id === editingProduct.id) : nextProductIndex, prev.variants.length) },
      ],
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const handleSuggestPrice = async () => {
    setIsLoadingSuggestion(true);
    setSuggestionError(null);
    setPriceSuggestion(null);
    try {
      const res = await api.post('/products/suggest-price', {
        category: form.category,
        tags: [],
        featured: false,
        exclude_product_id: editingProduct?.id || null,
      });
      setPriceSuggestion(res.data.data);
    } catch (err) {
      setSuggestionError(err.message);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 5) {
      toast.error('Solo puedes subir hasta 5 imagenes.');
      event.target.value = '';
      return;
    }
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const uploadImagesIfNeeded = async () => {
    if (imageFiles.length === 0) {
      return form.images || [];
    }
    if (imageFiles.length < 3 || imageFiles.length > 5) {
      throw new Error('Cada gorra debe tener entre 3 y 5 imagenes.');
    }
    const uploadData = new FormData();
    imageFiles.forEach((file) => uploadData.append('images', file));
    const uploadRes = await api.post('/products/images', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return uploadRes.data.data.images;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const images = await uploadImagesIfNeeded();
      if (images.length < 3 || images.length > 5) {
        toast.error('Cada gorra debe tener entre 3 y 5 imagenes.');
        return;
      }
      const payload = {
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        category: form.category,
        images,
        variants: form.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: Number(v.stock || 0),
          active: v.active ?? true,
        })),
        status: 'active',
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', payload);
        toast.success('Producto creado');
      }
      closeForm();
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archivar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto archivado');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const storeNeedsApproval = store && store.status !== 'active';

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-charcoal-950 dark:text-white">Productos</h2>
          <p className="text-sm text-charcoal-500 dark:text-zinc-400">Gestiona tu catalogo, variantes y stock</p>
        </div>
        <button
          type="button"
          onClick={showForm ? closeForm : openNewProduct}
          className="bg-gold hover:bg-gold-dark text-white dark:bg-gold-light dark:text-charcoal-950 dark:hover:bg-gold px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nuevo producto'}
        </button>
      </header>

      {storeNeedsApproval && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-light">
          Tu tienda esta pendiente de aprobacion del administrador. Puedes cargar y editar productos, pero apareceran en el catalogo publico hasta que la tienda quede aprobada.
        </div>
      )}

      <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
        Comision marketplace: Kingsley retiene 10% sobre el subtotal de productos por cada venta. El resto queda como monto a liquidar al vendedor.
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-charcoal-950 dark:text-white">
              {editingProduct ? 'Editar producto' : 'Crear producto'}
            </h3>
            {editingProduct && (
              <span className="text-xs text-charcoal-500 dark:text-zinc-400">Editando: {editingProduct.name}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-charcoal-700 dark:text-zinc-300">Nombre</span>
              <input required className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="text-charcoal-700 dark:text-zinc-300">Categoria</span>
              <select className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Dad Hat</option>
                <option>Trucker</option>
                <option>Snapback</option>
                <option>Fitted</option>
                <option>Boina</option>
                <option>Streetwear</option>
                <option>Urban</option>
              </select>
            </label>
            <div className="block text-sm">
              <span className="text-charcoal-700 dark:text-zinc-300">Precio base (GTQ)</span>
              <div className="mt-1 flex gap-2">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleSuggestPrice}
                  disabled={!form.category || isLoadingSuggestion}
                  className="flex items-center gap-1.5 px-3 rounded-lg text-sm font-semibold bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold-light hover:bg-gold/20 dark:hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isLoadingSuggestion
                    ? <Spinner size="sm" className="text-gold dark:text-gold-light" />
                    : 'Sugerir precio IA'}
                </button>
              </div>
              {suggestionError && (
                <p className="mt-1 text-xs text-red-500">{suggestionError}</p>
              )}
            </div>
            <label className="block text-sm">
              <span className="text-charcoal-700 dark:text-zinc-300">
                {editingProduct ? 'Reemplazar imagenes (3 a 5 archivos)' : 'Imagenes de la gorra (3 a 5 archivos)'}
              </span>
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" multiple onChange={handleImagesChange} className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-charcoal-900 dark:text-white file:mr-3 file:border-0 file:rounded-md file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-charcoal-950 focus:outline-none focus:ring-2 focus:ring-gold/40" />
              <span className="mt-1 block text-xs text-charcoal-500 dark:text-zinc-400">Formatos permitidos: PNG, JPG, JPEG, WEBP y GIF.</span>
            </label>
          </div>

          {priceSuggestion && (
            <div className="rounded-xl border border-charcoal-100 dark:border-white/10 bg-charcoal-50 dark:bg-charcoal-800/50 p-4 space-y-3">
              {priceSuggestion.confidence === 0 ? (
                <p className="text-sm text-charcoal-500 dark:text-zinc-400">
                  Sin datos suficientes en esta categoria.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-zinc-400">
                        Precio sugerido
                      </p>
                      <p className="text-2xl font-bold text-charcoal-900 dark:text-white">
                        Q{priceSuggestion.suggestedPrice?.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, basePrice: priceSuggestion.suggestedPrice }))}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-gold text-white hover:bg-gold-dark dark:bg-gold-light dark:text-charcoal-950 dark:hover:bg-gold transition-colors whitespace-nowrap"
                    >
                      Usar este precio
                    </button>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-charcoal-500 dark:text-zinc-400">
                      Confianza: {priceSuggestion.confidence}%
                    </p>
                    <div className="h-2 w-full rounded-full bg-charcoal-200 dark:bg-charcoal-700">
                      <div className={`h-2 rounded-full transition-all ${CONFIDENCE_CLASSES[priceSuggestion.confidence] || 'w-0 bg-red-400'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-charcoal-600 dark:text-zinc-300">{priceSuggestion.reasoning}</p>
                  {priceSuggestion.similarProducts?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-zinc-400">
                        Productos similares
                      </p>
                      <ul className="space-y-1">
                        {priceSuggestion.similarProducts.map((p, i) => (
                          <li key={i} className="flex justify-between text-sm text-charcoal-700 dark:text-zinc-300">
                            <span>{p.name}</span>
                            <span className="font-medium">Q{p.price?.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={`${preview}-${index}`} className="aspect-square rounded-lg border border-charcoal-200 dark:border-white/10 bg-charcoal-50 dark:bg-charcoal-800 overflow-hidden">
                  <img src={preview} alt={`Vista previa ${index + 1}`} className="w-full h-full object-contain p-1" />
                </div>
              ))}
            </div>
          )}

          <label className="block text-sm">
            <span className="text-charcoal-700 dark:text-zinc-300">Descripcion</span>
            <textarea rows={3} className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-charcoal-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-charcoal-700 dark:text-zinc-300">Variantes</h3>
              <button type="button" onClick={handleAddVariant} className="text-sm text-gold dark:text-gold-light hover:text-gold-dark dark:hover:text-gold-light">
                + Agregar variante
              </button>
            </div>
            <div className="hidden md:grid grid-cols-4 gap-2 px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500 dark:text-zinc-400">
              <span>Talla</span>
              <span>Color</span>
              <span>SKU correlativo</span>
              <span>Cantidad en stock</span>
            </div>
            <div className="space-y-2">
              {form.variants.map((variant, index) => (
                <div key={variant.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <label className="text-xs text-charcoal-500 dark:text-zinc-400 md:text-transparent">
                    Talla
                    <input className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-sm text-charcoal-900 dark:text-white" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} />
                  </label>
                  <label className="text-xs text-charcoal-500 dark:text-zinc-400 md:text-transparent">
                    Color
                    <input className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-sm text-charcoal-900 dark:text-white" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} />
                  </label>
                  <label className="text-xs text-charcoal-500 dark:text-zinc-400 md:text-transparent">
                    SKU correlativo
                    <input required className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-sm text-charcoal-900 dark:text-white" value={variant.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} />
                  </label>
                  <label className="text-xs text-charcoal-500 dark:text-zinc-400 md:text-transparent">
                    Cantidad en stock
                    <input type="number" min="0" className="mt-1 w-full border border-charcoal-200 dark:border-white/10 bg-zinc-50 dark:bg-charcoal-800 rounded-lg p-2 text-sm text-charcoal-900 dark:text-white" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="bg-gold hover:bg-gold-dark text-white dark:bg-gold-light dark:text-charcoal-950 dark:hover:bg-gold px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            {editingProduct ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-100 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-charcoal-100 dark:divide-white/10 text-sm">
          <thead className="bg-charcoal-50 dark:bg-charcoal-950">
            <tr>
              <th className="px-4 py-3 text-left text-charcoal-500 dark:text-zinc-400 font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-charcoal-500 dark:text-zinc-400 font-medium">Categoria</th>
              <th className="px-4 py-3 text-right text-charcoal-500 dark:text-zinc-400 font-medium">Precio</th>
              <th className="px-4 py-3 text-right text-charcoal-500 dark:text-zinc-400 font-medium">Variantes</th>
              <th className="px-4 py-3 text-right text-charcoal-500 dark:text-zinc-400 font-medium">Stock total</th>
              <th className="px-4 py-3 text-left text-charcoal-500 dark:text-zinc-400 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-50 dark:divide-white/5">
            {loading && (
              <tr><td colSpan="7" className="text-center py-6 text-charcoal-500 dark:text-zinc-400">Cargando...</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan="7" className="text-center py-6 text-charcoal-500 dark:text-zinc-400">Sin productos todavia</td></tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-charcoal-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-charcoal-900 dark:text-white">{product.name}</td>
                <td className="px-4 py-3 text-charcoal-600 dark:text-zinc-400">{product.category}</td>
                <td className="px-4 py-3 text-right text-charcoal-700 dark:text-zinc-300">{formatCurrency(product.basePrice ?? product.base_price)}</td>
                <td className="px-4 py-3 text-right text-charcoal-700 dark:text-zinc-300">{product.variants?.length ?? 0}</td>
                <td className="px-4 py-3 text-right text-charcoal-700 dark:text-zinc-300">{totalStock(product)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${STATUS_COLOR[product.status] || 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-800 dark:text-zinc-300'}`}>
                    {STATUS_LABEL[product.status] || product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => openEditProduct(product)} className="text-gold dark:text-gold-light hover:underline text-sm font-semibold">
                      Editar
                    </button>
                    {product.status !== 'archived' && (
                      <button type="button" onClick={() => handleArchive(product.id)} className="text-red-600 hover:underline text-sm">
                        Archivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
