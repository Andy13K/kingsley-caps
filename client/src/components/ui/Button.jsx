const variants = {
  primary:   'bg-charcoal-950 dark:bg-zinc-100 text-white dark:text-charcoal-950 hover:bg-charcoal-900 dark:hover:bg-white active:scale-[0.98] focus-visible:ring-charcoal-950',
  blue:      'bg-blue-dark text-white hover:bg-blue active:scale-[0.98] focus-visible:ring-blue dark:bg-blue dark:hover:bg-blue-dark',
  gold:      'bg-gold text-white hover:bg-gold-dark active:scale-[0.98] focus-visible:ring-gold',
  outline:   'border border-charcoal-200 dark:border-zinc-600 text-charcoal-950 dark:text-zinc-100 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 active:scale-[0.98] focus-visible:ring-charcoal-950',
  ghost:     'text-charcoal-900 dark:text-zinc-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 active:scale-[0.98] focus-visible:ring-charcoal-900',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] focus-visible:ring-red-600',
  secondary: 'bg-charcoal-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-zinc-100 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 active:scale-[0.98] focus-visible:ring-charcoal-900',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200 ease-smooth
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-950
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
