import Button from '../ui/Button';

const WalletIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const LinkIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);
const CoinIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XCircleIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GUIDES = {
  ERR_C01: {
    Icon: WalletIcon,
    title: 'MetaMask no instalado',
    body: 'Necesitas la extensión MetaMask para pagar con criptomonedas. Instálala en tu navegador y vuelve.',
    color: 'orange',
    action: () => (
      <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#f6851b] hover:bg-[#e2761b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
        Instalar MetaMask
      </a>
    ),
  },
  ERR_C02: {
    Icon: LockIcon,
    title: 'Conexión rechazada',
    body: 'Acepta la solicitud de conexión en la ventana de MetaMask e intenta de nuevo.',
    color: 'gray',
    action: (_, onRetry) => <Button size="sm" variant="secondary" onClick={onRetry}>Reintentar conexión</Button>,
  },
  ERR_C03: {
    Icon: LinkIcon,
    title: 'Red incorrecta',
    body: 'Debes estar en la red Sepolia Testnet para realizar pagos de prueba.',
    color: 'yellow',
    action: (onSwitchNetwork) => <Button size="sm" variant="secondary" onClick={onSwitchNetwork}>Cambiar a Sepolia</Button>,
  },
  ERR_C04: {
    Icon: CoinIcon,
    title: 'Fondos insuficientes',
    body: 'No tienes suficiente ETH de prueba. Obtén ETH gratis desde un Sepolia faucet (sepoliafaucet.com).',
    color: 'red',
    action: (_, onRetry) => <Button size="sm" variant="secondary" onClick={onRetry}>Reintentar</Button>,
  },
  ERR_C05: {
    Icon: XCircleIcon,
    title: 'Transacción cancelada',
    body: 'Cancelaste la transacción en MetaMask. Puedes intentarlo nuevamente cuando quieras.',
    color: 'gray',
    action: (_, onRetry) => <Button size="sm" variant="secondary" onClick={onRetry}>Intentar de nuevo</Button>,
  },
  ERR_C06: {
    Icon: ClockIcon,
    title: 'Tiempo agotado',
    body: 'El tiempo para completar el pago expiró. Renueva el precio bloqueado para continuar.',
    color: 'red',
    action: (_, onRetry) => <Button size="sm" variant="secondary" onClick={onRetry}>Reiniciar pago</Button>,
  },
};

const COLOR_MAP = {
  orange: { wrap: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', icon: 'text-orange-500 dark:text-orange-400', title: 'text-orange-900 dark:text-orange-300', body: 'text-orange-700 dark:text-orange-400' },
  yellow: { wrap: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', icon: 'text-amber-500 dark:text-amber-400', title: 'text-amber-900 dark:text-amber-300', body: 'text-amber-700 dark:text-amber-400' },
  red:    { wrap: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', icon: 'text-red-500 dark:text-red-400', title: 'text-red-900 dark:text-red-300', body: 'text-red-700 dark:text-red-400' },
  gray:   { wrap: 'bg-charcoal-50 dark:bg-charcoal-900 border-charcoal-100 dark:border-white/10', icon: 'text-charcoal-800/75 dark:text-zinc-400', title: 'text-charcoal-950 dark:text-zinc-100', body: 'text-charcoal-800/70 dark:text-zinc-400' },
};

export default function MetaMaskGuide({ errorCode, onRetry, onSwitchNetwork }) {
  const guide = GUIDES[errorCode];
  if (!guide) return null;
  const colors = COLOR_MAP[guide.color] ?? COLOR_MAP.gray;
  const { Icon } = guide;
  return (
    <div className={`border rounded-2xl p-6 text-center ${colors.wrap}`} role="alert">
      <div className={`flex justify-center mb-3 ${colors.icon}`}><Icon /></div>
      <h3 className={`font-bold text-base mb-2 ${colors.title}`}>{guide.title}</h3>
      <p className={`text-sm mb-4 leading-relaxed ${colors.body}`}>{guide.body}</p>
      {guide.action(onSwitchNetwork, onRetry)}
    </div>
  );
}
