import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import api from '../../services/api';

export default function VirtualTryOn({ productId, productName, productImages = [] }) {
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const capImageUrl = productImages[0] ?? null;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Por favor sube una imagen válida'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('La imagen no debe superar 10MB'); return; }
    setUserPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUserPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userPhoto) { toast.error('Sube una foto de tu cara para continuar'); return; }
    if (!capImageUrl) { toast.error('Este producto no tiene imagen disponible'); return; }

    setLoading(true);
    const toastId = toast.loading('Generando tu prueba virtual...');
    try {
      const formData = new FormData();
      formData.append('userPhoto', userPhoto);
      formData.append('capImageUrl', capImageUrl);

      const { data } = await api.post(`/products/${productId}/try-on`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });

      setResult(data.data);
      toast.success('¡Listo!', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Error al generar la prueba virtual', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setUserPhoto(null);
    setUserPhotoPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white">
            Así te ves con la {productName}
          </h3>
          <button onClick={reset} className="text-sm text-gold dark:text-gold-light hover:underline">
            Nueva prueba
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-charcoal-500 dark:text-zinc-400 mb-2 text-center">Tu foto</p>
            {userPhotoPreview && (
              <img src={userPhotoPreview} alt="Tu foto" className="w-full rounded-xl object-cover max-h-80" />
            )}
          </div>
          <div>
            <p className="text-xs text-charcoal-500 dark:text-zinc-400 mb-2 text-center">Con la gorra</p>
            {result.generatedImageUrl ? (
              <img
                src={result.generatedImageUrl}
                alt="Resultado"
                className="w-full rounded-xl object-cover max-h-80"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center rounded-xl bg-charcoal-50 dark:bg-charcoal-800 text-sm text-charcoal-400 dark:text-zinc-500">
                No se pudo generar
              </div>
            )}
          </div>
        </div>
        {result.description && (
          <p className="mt-4 text-sm text-charcoal-600 dark:text-zinc-400 text-center leading-relaxed">
            {result.description}
          </p>
        )}
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={reset}>Nueva prueba</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <h3 className="text-lg font-semibold text-charcoal-900 dark:text-white mb-1">
        Prueba Virtual
      </h3>
      <p className="text-sm text-charcoal-500 dark:text-zinc-400 mb-5">
        Sube tu selfie y mira cómo te queda la {productName}.
      </p>

      {capImageUrl && (
        <div className="flex items-center gap-3 mb-5 p-3 bg-charcoal-50 dark:bg-charcoal-800 rounded-xl">
          <img
            src={capImageUrl}
            alt={productName}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-charcoal-700 dark:text-zinc-200 truncate">{productName}</p>
            <p className="text-xs text-charcoal-400 dark:text-zinc-500">Gorra seleccionada</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl transition-colors ${
              userPhotoPreview
                ? 'border-gold dark:border-gold-light'
                : 'border-charcoal-200 dark:border-charcoal-700 hover:border-gold dark:hover:border-gold-light'
            }`}
          >
            {userPhotoPreview ? (
              <img
                src={userPhotoPreview}
                alt="Vista previa"
                className="w-full h-56 object-cover rounded-xl"
              />
            ) : (
              <div className="py-10 text-center">
                <svg
                  className="w-8 h-8 mx-auto mb-3 text-charcoal-300 dark:text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
                <p className="text-sm font-medium text-charcoal-600 dark:text-zinc-300 mb-1">
                  Foto de frente a la cámara
                </p>
                <p className="text-xs text-charcoal-400 dark:text-zinc-500">
                  Buena iluminación · PNG o JPG · máx 10MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            disabled={loading}
          />
          {userPhoto && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">✓ {userPhoto.name}</p>
          )}
        </div>

        <Button type="submit" disabled={loading || !userPhoto} className="w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              Generando...
            </span>
          ) : (
            'Generar prueba virtual'
          )}
        </Button>
      </form>
    </div>
  );
}
