import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import api from '../../services/api';

function VirtualTryOn({ productId, productName }) {
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const [capImage, setCapImage] = useState(null);
  const [capImagePreview, setCapImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const userPhotoInputRef = useRef(null);
  const capImageInputRef = useRef(null);

  const handleUserPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor sube una imagen válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB');
      return;
    }

    setUserPhoto(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCapImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor sube una imagen válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB');
      return;
    }

    setCapImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userPhoto) {
      toast.error('Sube una foto tuya para continuar');
      return;
    }

    if (!capImage) {
      toast.error('Sube una imagen de la gorra');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Analizando tu look con la gorra...');

    try {
      const formData = new FormData();
      formData.append('userPhoto', userPhoto);
      formData.append('capImage', capImage);

      const { data } = await api.post(`/products/${productId}/try-on`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      setAnalysis(data.data);
      setShowResults(true);
      toast.success('¡Análisis completado!', { id: toastId });
    } catch (error) {
      toast.error(error.message || 'Error al procesar la prueba virtual', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserPhoto(null);
    setUserPhotoPreview(null);
    setCapImage(null);
    setCapImagePreview(null);
    setAnalysis(null);
    setShowResults(false);
    if (userPhotoInputRef.current) userPhotoInputRef.current.value = '';
    if (capImageInputRef.current) capImageInputRef.current.value = '';
  };

  if (showResults && analysis) {
    const generatedUrl = analysis.generatedImageUrl;
    const description = analysis.description;

    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-8 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            ✨ Así te ves con la {productName}
          </h3>
          <button
            onClick={resetForm}
            className="text-sm text-amber-700 dark:text-amber-300 hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Tu Foto Original</h4>
            {userPhotoPreview && (
              <img
                src={userPhotoPreview}
                alt="Tu foto"
                className="w-full h-auto rounded-lg shadow-md max-h-[480px] object-cover"
              />
            )}
          </div>

          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Con la Gorra Puesta</h4>
            {generatedUrl ? (
              <img
                src={generatedUrl}
                alt={`Tú con la gorra ${productName}`}
                className="w-full h-auto rounded-lg shadow-md max-h-[480px] object-cover"
              />
            ) : (
              <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 text-center text-charcoal-600 dark:text-zinc-400">
                La IA no pudo generar la imagen esta vez.
              </div>
            )}
          </div>
        </div>

        {description && (
          <div className="mt-6 bg-white dark:bg-charcoal-800 rounded-lg p-4">
            <p className="text-charcoal-700 dark:text-zinc-300 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-amber-200 dark:border-amber-800">
          <p className="text-center text-charcoal-600 dark:text-zinc-400 mb-4">
            ¿Te gusta cómo se ve? ¡Agrega la gorra a tu carrito!
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={resetForm}>
              Nueva Prueba
            </Button>
            <Button>
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-8 border border-blue-200 dark:border-blue-800">
      <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
        🎩 Prueba Virtual de la Gorra
      </h3>
      <p className="text-charcoal-700 dark:text-zinc-300 mb-6">
        Sube una foto tuya y mira cómo se vería la {productName} contigo. Nuestra IA hará un análisis completo de
        tu estilo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 border-2 border-dashed border-blue-300 dark:border-blue-700">
            <label className="block mb-4">
              <span className="font-semibold text-charcoal-800 dark:text-zinc-100 block mb-3">
                📸 Tu Foto
              </span>
              <div
                onClick={() => userPhotoInputRef.current?.click()}
                className="cursor-pointer text-center py-8 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
              >
                {userPhotoPreview ? (
                  <img
                    src={userPhotoPreview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div>
                    <p className="text-charcoal-600 dark:text-zinc-400 mb-2">
                      Haz clic para subir tu foto
                    </p>
                    <p className="text-sm text-charcoal-500 dark:text-zinc-500">
                      PNG, JPG (máx 10MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={userPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleUserPhotoChange}
                className="hidden"
                disabled={loading}
              />
            </label>
            {userPhoto && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ {userPhoto.name}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-charcoal-800 rounded-lg p-6 border-2 border-dashed border-indigo-300 dark:border-indigo-700">
            <label className="block">
              <span className="font-semibold text-charcoal-800 dark:text-zinc-100 block mb-3">
                🎩 Imagen de la Gorra
              </span>
              <div
                onClick={() => capImageInputRef.current?.click()}
                className="cursor-pointer text-center py-8 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition"
              >
                {capImagePreview ? (
                  <img
                    src={capImagePreview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div>
                    <p className="text-charcoal-600 dark:text-zinc-400 mb-2">
                      Haz clic para subir la imagen de la gorra
                    </p>
                    <p className="text-sm text-charcoal-500 dark:text-zinc-500">
                      PNG, JPG (máx 10MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={capImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleCapImageChange}
                className="hidden"
                disabled={loading}
              />
            </label>
            {capImage && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ {capImage.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={resetForm}
            disabled={loading || (!userPhoto && !capImage)}
          >
            Limpiar
          </Button>
          <Button type="submit" disabled={loading || !userPhoto || !capImage} className="min-w-48">
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Analizando...
              </span>
            ) : (
              '✨ Ver Resultado'
            )}
          </Button>
        </div>
      </form>

      <p className="text-xs text-charcoal-500 dark:text-zinc-500 text-center mt-6">
        💡 Consejo: Para mejores resultados, usa una foto clara de frente con buena iluminación
      </p>
    </div>
  );
}

export default VirtualTryOn;
