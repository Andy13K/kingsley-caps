const METHODS = [
  {
    id: 'crypto_eth',
    label: 'Criptomoneda (ETH)',
    description: 'Paga con Ethereum vía MetaMask en la red Sepolia.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Tarjeta de crédito / débito',
    description: 'Visa, Mastercard y otras tarjetas aceptadas.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    id: 'transfer',
    label: 'Transferencia bancaria',
    description: 'Transfiere directamente a nuestra cuenta bancaria.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
];

export default function PaymentSelector({ selected, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-black text-charcoal-950 dark:text-zinc-50 text-lg tracking-tight">Método de pago</h2>

      {METHODS.map((method) => (
        <label
          key={method.id}
          className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
            ${selected === method.id
              ? 'border-blue-dark dark:border-blue bg-blue-dark dark:bg-blue/10 text-white dark:text-zinc-50'
              : 'border-charcoal-100 dark:border-white/10 bg-white dark:bg-charcoal-900 text-charcoal-700 dark:text-zinc-300 hover:border-blue-dark/30 dark:hover:border-blue/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.id}
            checked={selected === method.id}
            onChange={() => !disabled && onChange(method.id)}
            disabled={disabled}
            className="sr-only"
          />
          <div className={`mt-0.5 flex-shrink-0 ${selected === method.id ? 'text-blue-light' : 'text-charcoal-800/70 dark:text-zinc-400'}`}>
            {method.icon}
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm ${selected === method.id ? 'text-white dark:text-zinc-50' : 'text-charcoal-950 dark:text-zinc-100'}`}>
              {method.label}
            </p>
            <p className={`text-xs mt-0.5 ${selected === method.id ? 'text-blue-muted/70 dark:text-blue-light/60' : 'text-charcoal-800/70 dark:text-zinc-400'}`}>
              {method.description}
            </p>
          </div>
          {selected === method.id && (
            <svg className="w-4 h-4 text-blue-light flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </label>
      ))}
    </div>
  );
}
