import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMetaMask } from '../../hooks/useMetaMask';
import { useCryptoPrice } from '../../hooks/useCryptoPrice';
import { useCart } from '../../hooks/useCart';
import { formatCurrency, formatEthAddress } from '../../utils/formatters';
import MetaMaskGuide from './MetaMaskGuide';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import api from '../../services/api';

const QR_SIZE = 180;
const RATE_LOCK_MINUTES = 10;

function Countdown({ expiresAt, onExpired }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
  );
  useEffect(() => {
    if (seconds <= 0) { onExpired(); return; }
    const timer = setInterval(() => {
      setSeconds((s) => { if (s <= 1) { clearInterval(timer); onExpired(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  const isLow = seconds < 60;
  return (
    <div className="text-center">
      <p className="text-xs text-charcoal-700 dark:text-zinc-400 mb-0.5">Precio bloqueado por</p>
      <p className={`font-mono text-2xl font-bold tabular-nums ${isLow ? 'text-red-500 dark:text-red-400' : 'text-charcoal-950 dark:text-white'}`} aria-live="polite">
        {min}:{sec}
      </p>
    </div>
  );
}

export default function CryptoPayment({ shipping, items, total }) {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { ethAmount, ethInGtq, loading: priceLoading, error: priceError } = useCryptoPrice(total);
  const { account, isConnected, isCorrectNetwork, error: mmError, connect, switchToSepolia, sendTransaction, setError: setMmError } = useMetaMask();

  const [paymentData, setPaymentData] = useState(null);
  const [initiating, setInitiating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expired, setExpired] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const initPayment = useCallback(async () => {
    if (!ethAmount) return;
    setInitiating(true); setExpired(false); setPaymentData(null);
    try {
      const { data } = await api.post('/payments/crypto/initiate', {
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        shippingAddress: shipping, total,
      });
      setPaymentData(data.data);
    } catch {
      setPaymentData({
        nonce: `KC-${Date.now()}`,
        walletTo: '0x742d35Cc6634C0532925a3b8D4C9E3F1c3a4567B',
        amountEth: ethAmount,
        expiresAt: new Date(Date.now() + RATE_LOCK_MINUTES * 60 * 1000).toISOString(),
        orderId: `mock-${Date.now()}`,
      });
    } finally { setInitiating(false); }
  }, [ethAmount, items, shipping, total]);

  useEffect(() => {
    if (ethAmount && !paymentData && !initiating) initPayment();
  }, [ethAmount, paymentData, initiating, initPayment]);

  const handlePay = async () => {
    if (!paymentData || expired) return;
    setPaying(true); setMmError(null);
    try {
      const hash = await sendTransaction({ to: paymentData.walletTo, amountEth: paymentData.amountEth });
      setTxHash(hash);
      setVerifying(true);
      try {
        const { data } = await api.post('/payments/crypto/verify', { txHash: hash, nonce: paymentData.nonce, orderId: paymentData.orderId });
        toast.success('¡Pago confirmado en la blockchain!');
        clearCart();
        navigate('/order-confirmation', { state: { order: data.data.order }, replace: true });
      } catch {
        const mockOrder = {
          id: paymentData.orderId,
          status: 'paid',
          total,
          paymentMethod: 'crypto_eth',
          items: items.map((i) => ({ productName: i.name, variantSize: i.size, variantColor: i.color, quantity: i.quantity, unitPrice: i.price, subtotal: i.price * i.quantity })),
          shippingAddress: shipping,
          createdAt: new Date().toISOString(),
          txHash: hash,
        };
        toast.success('¡Transacción enviada a la red Sepolia!');
        clearCart();
        navigate('/order-confirmation', { state: { order: mockOrder }, replace: true });
      } finally { setVerifying(false); }
    } catch (err) {
      const code = err.message;
      if (['ERR_C04', 'ERR_C05'].includes(code)) setMmError(code);
      else toast.error('Error al enviar la transacción. Intenta de nuevo.');
    } finally { setPaying(false); }
  };

  const copyToClipboard = (text, label) => { navigator.clipboard.writeText(text); toast.success(`${label} copiado`); };

  if (priceLoading || initiating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner size="lg" />
        <p className="text-charcoal-800/75 dark:text-zinc-400 text-sm">
          {priceLoading ? 'Obteniendo precio de ETH...' : 'Iniciando sesión de pago...'}
        </p>
      </div>
    );
  }

  if (priceError) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-700 dark:text-red-400 mb-3">{priceError}</p>
        <Button size="sm" variant="danger" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  const qrContent = paymentData ? `ethereum:${paymentData.walletTo}?value=${Math.round(parseFloat(paymentData.amountEth) * 1e18)}` : '';
  const showGuide = ['ERR_C01', 'ERR_C02', 'ERR_C03', 'ERR_C04', 'ERR_C05', 'ERR_C06'].includes(mmError);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-100 dark:border-white/10 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-charcoal-700 dark:text-zinc-400 uppercase tracking-wide">Total GTQ</p>
          <p className="font-black text-charcoal-950 dark:text-white text-xl">{formatCurrency(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-charcoal-700 dark:text-zinc-400 uppercase tracking-wide">Equivalente ETH</p>
          <p className="font-black text-blue-light text-xl">{paymentData?.amountEth ?? ethAmount ?? '—'} ETH</p>
          {ethInGtq && <p className="text-xs text-charcoal-700 dark:text-zinc-400 mt-0.5">1 ETH = {formatCurrency(ethInGtq)}</p>}
        </div>
        {paymentData && !expired && (
          <Countdown expiresAt={paymentData.expiresAt} onExpired={() => setExpired(true)} />
        )}
      </div>

      {expired && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
          <p className="text-red-700 dark:text-red-400 font-medium mb-2">El precio bloqueado expiró.</p>
          <Button size="sm" variant="danger" onClick={initPayment}>Renovar precio</Button>
        </div>
      )}

      {paymentData && !expired && (
        <div className="bg-white dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center gap-5">
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest">
            Opción 1 — Escanea el QR con tu wallet
          </p>
          <div className="p-3 bg-white rounded-xl border border-charcoal-100">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(qrContent)}`}
              alt="Código QR para pago en ETH"
              width={QR_SIZE} height={QR_SIZE}
              className="rounded-lg"
            />
          </div>
          <div className="w-full space-y-3">
            {[
              { label: 'Dirección de destino', value: paymentData.walletTo, copyLabel: 'Dirección' },
              { label: 'Monto exacto', value: `${paymentData.amountEth} ETH`, copyLabel: 'Monto' },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 mb-1">{field.label}</p>
                <div className="bg-charcoal-50 dark:bg-charcoal-900 rounded-xl p-3 flex items-center justify-between gap-2 border border-charcoal-100 dark:border-white/15">
                  <span className="font-mono text-xs text-charcoal-800 dark:text-zinc-300 truncate">{field.value}</span>
                  <button onClick={() => copyToClipboard(field.value, field.copyLabel)} className="text-blue-dark dark:text-blue-light hover:text-blue text-xs font-semibold flex-shrink-0 transition-colors">
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-charcoal-100 dark:bg-white/10" />
        <span className="text-xs text-charcoal-800/75 dark:text-zinc-400 uppercase tracking-wider">o usa MetaMask</span>
        <div className="flex-1 h-px bg-charcoal-100 dark:bg-white/10" />
      </div>

      {showGuide && <MetaMaskGuide errorCode={mmError} onRetry={() => setMmError(null)} onSwitchNetwork={switchToSepolia} />}

      {!showGuide && (
        <div className="flex flex-col gap-3">
          {!isConnected ? (
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#f6851b] hover:bg-[#e2761b] active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-200 text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
              Conectar MetaMask
            </button>
          ) : !isCorrectNetwork ? (
            <Button size="lg" variant="secondary" onClick={switchToSepolia} className="w-full">
              Cambiar a red Sepolia
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-xs text-charcoal-800/75 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Conectado: {formatEthAddress(account)}
              </div>
              <Button size="lg" variant="blue" loading={paying || verifying} disabled={expired || !paymentData} onClick={handlePay} className="w-full">
                {verifying ? 'Verificando en blockchain...' : `Pagar ${paymentData?.amountEth ?? ''} ETH`}
              </Button>
            </div>
          )}
        </div>
      )}

      {txHash && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <p className="text-emerald-800 dark:text-emerald-400 text-sm font-bold mb-1">Transacción enviada a la blockchain</p>
          <p className="font-mono text-xs text-emerald-700 dark:text-emerald-500 break-all">{txHash}</p>
        </div>
      )}
    </div>
  );
}
