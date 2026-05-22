const uniqueValues = (variants, key) => [...new Set(variants.map((v) => v[key]).filter(Boolean))];

export default function VariantSelector({ variants, selected, onChange }) {
  const activeVariants = variants.filter((v) => v.active);
  const sizes = uniqueValues(activeVariants, 'size');
  const selectedSize = selected?.size ?? null;
  const colorsForSize = selectedSize
    ? uniqueValues(activeVariants.filter((v) => v.size === selectedSize), 'color')
    : uniqueValues(activeVariants, 'color');
  const selectedColor = selected?.color ?? null;

  const handleSize = (size) => {
    const match = activeVariants.find((v) => v.size === size && v.color === selectedColor)
      ?? activeVariants.find((v) => v.size === size);
    if (match) onChange(match);
  };

  const handleColor = (color) => {
    const match = activeVariants.find((v) => v.size === selectedSize && v.color === color)
      ?? activeVariants.find((v) => v.color === color);
    if (match) onChange(match);
  };

  const sizeOutOfStock = (size) => activeVariants.filter((v) => v.size === size).every((v) => v.stock === 0);
  const colorOutOfStock = (color) =>
    activeVariants.filter((v) => v.color === color && (!selectedSize || v.size === selectedSize)).every((v) => v.stock === 0);

  return (
    <div className="flex flex-col gap-5">
      {sizes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest mb-2.5">
            Talla
            {selectedSize && <span className="ml-1.5 normal-case font-normal text-charcoal-800/70 dark:text-zinc-400">{selectedSize}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const oos = sizeOutOfStock(size);
              return (
                <button
                  key={size}
                  onClick={() => !oos && handleSize(size)}
                  disabled={oos}
                  aria-label={`Talla ${size}${oos ? ' — Sin stock' : ''}`}
                  aria-pressed={selectedSize === size}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-200
                    ${selectedSize === size
                      ? 'border-blue-dark dark:border-blue bg-blue-dark dark:bg-blue text-white'
                      : oos
                        ? 'border-charcoal-100 dark:border-white/15 text-charcoal-800/70 dark:text-zinc-400 cursor-not-allowed line-through'
                        : 'border-charcoal-200 dark:border-white/15 text-charcoal-700 dark:text-zinc-300 hover:border-blue-dark dark:hover:border-blue'
                    }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colorsForSize.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest mb-2.5">
            Color
            {selectedColor && <span className="ml-1.5 normal-case font-normal text-charcoal-800/70 dark:text-zinc-400">{selectedColor}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {colorsForSize.map((color) => {
              const oos = colorOutOfStock(color);
              return (
                <button
                  key={color}
                  onClick={() => !oos && handleColor(color)}
                  disabled={oos}
                  aria-label={`Color ${color}${oos ? ' — Sin stock' : ''}`}
                  aria-pressed={selectedColor === color}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-200
                    ${selectedColor === color
                      ? 'border-blue-dark dark:border-blue bg-blue-dark dark:bg-blue text-white'
                      : oos
                        ? 'border-charcoal-100 dark:border-white/15 text-charcoal-800/70 dark:text-zinc-400 cursor-not-allowed line-through'
                        : 'border-charcoal-200 dark:border-white/15 text-charcoal-700 dark:text-zinc-300 hover:border-blue-dark dark:hover:border-blue'
                    }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <p className={`text-sm font-semibold ${selected.stock === 0 ? 'text-red-600 dark:text-red-400' : selected.stock <= selected.low_stock_threshold ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {selected.stock === 0 ? 'Sin stock disponible' : selected.stock <= selected.low_stock_threshold ? `Solo quedan ${selected.stock} unidades` : `${selected.stock} disponibles`}
        </p>
      )}
    </div>
  );
}
