const variants = {
  success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50  dark:bg-amber-950/50  text-amber-700  dark:text-amber-400  border border-amber-200  dark:border-amber-800',
  danger:  'bg-red-50    dark:bg-red-950/50    text-red-700    dark:text-red-400    border border-red-200    dark:border-red-800',
  info:    'bg-blue-muted dark:bg-blue-950/50  text-blue-dark  dark:text-blue-light border border-blue-200   dark:border-blue-800',
  gray:    'bg-charcoal-50 dark:bg-charcoal-900 text-charcoal-800/70 dark:text-zinc-400 border border-charcoal-100 dark:border-white/10',
  gold:    'bg-gold-muted dark:bg-gold/20 text-gold-dark dark:text-gold-light border border-gold/20 dark:border-gold-light/30',
};

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
