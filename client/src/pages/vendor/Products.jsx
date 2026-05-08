import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import { formatCurrency } from '../../utils/formatters.js';

const STATUS_LABEL = { draft: 'Borrador', active: 'Activo', archived: 'Archivado' };
const STATUS_COLOR = {
  draft: 'bg-gray-200 text-gray-700',
  active: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-700',
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: 'Snapback',
    images: '',
    variants: [{ size: 'M', color: 'Negro', sku: '', stock: 0 }],
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { limit: 50 } });
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const totalStock = useMemo(
    () => (product) =>
      (product.variants || []).reduce((sum, v) => sum + Number(v.stock || 0), 0),
    []
  );

  const handleAddVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: 'M', color: 'Negro', sku: '', stock: 0 }],
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        category: form.category,
        images: form.images
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        variants: form.variants.map((v) => ({
          ...v,
          stock: Number(v.stock || 0),
        })),
        status: 'active',
      });
      toast.success('Producto creado');
      setShowForm(false);
      setForm({
        name: '',
        description: '',
        basePrice: '',
        category: 'Snapback',
        images: '',
        variants: [{ size: 'M', color: 'Negro', sku: '', stock: 0 }],
      });
      loadProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archivar este producto?')) {
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto archivado');
      loadProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500">Gestiona tu catalogo y variantes</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="bg-kingsley-600 hover:bg-kingsley-700 text-white px-4 py-2 rounded-md text-sm"
        >
          {showForm ? 'Cancelar' : 'Nuevo producto'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-gray-700">Nombre</span>
              <input
                required
                className="mt-1 w-full border-gray-300 rounded-md p-2 border"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Categoria</span>
              <select
                className="mt-1 w-full border-gray-300 rounded-md p-2 border"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option>Snapback</option>
                <option>Trucker</option>
                <option>Beanie</option>
                <option>Fitted</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Precio base (GTQ)</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full border-gray-300 rounded-md p-2 border"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Imagenes (URLs separadas por coma)</span>
              <input
                className="mt-1 w-full border-gray-300 rounded-md p-2 border"
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-gray-700">Descripcion</span>
            <textarea
              rows={3}
              className="mt-1 w-full border-gray-300 rounded-md p-2 border"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Variantes</h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-sm text-kingsley-600 hover:underline"
              >
                + Agregar variante
              </button>
            </div>
            <div className="space-y-2">
              {form.variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                  <input
                    placeholder="Talla"
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={variant.size}
                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                  />
                  <input
                    placeholder="Color"
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={variant.color}
                    onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                  />
                  <input
                    placeholder="SKU"
                    required
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={variant.sku}
                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min="0"
                    className="border border-gray-300 rounded p-2 text-sm"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-kingsley-600 hover:bg-kingsley-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Crear producto
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Categoria</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium">Precio</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium">Variantes</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium">Stock total</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  Sin productos todavia
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.category}</td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatCurrency(product.basePrice)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {product.variants?.length ?? 0}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {totalStock(product)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs ${
                      STATUS_COLOR[product.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABEL[product.status] || product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {product.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(product.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Archivar
                    </button>
                  )}
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
