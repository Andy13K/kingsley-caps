export default function Input({ label, id, error, type = 'text', className = '', hint, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-charcoal-900 dark:text-zinc-200">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`
          w-full px-4 py-3 rounded-xl border text-sm
          bg-white dark:bg-charcoal-900
          text-charcoal-950 dark:text-zinc-50
          placeholder:text-charcoal-800/75 dark:placeholder:text-zinc-400
          transition-all duration-200 ease-smooth
          focus:outline-none focus:ring-2 focus:ring-blue-dark focus:border-transparent dark:focus:ring-blue-light
          ${error
            ? 'border-red-400 bg-red-50/40 dark:bg-red-950/30 focus:ring-red-500'
            : 'border-charcoal-100 dark:border-white/10 hover:border-charcoal-300 dark:hover:border-white/20'
          }
          disabled:bg-charcoal-50 dark:disabled:bg-charcoal-800 disabled:cursor-not-allowed disabled:opacity-60
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-charcoal-800/70 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
