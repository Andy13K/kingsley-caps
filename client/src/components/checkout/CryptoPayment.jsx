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

function Countdown({ expiresAt, onExpired }) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
  );

  useEffect(() => {
    if (seconds <= 0) {
      onExpired();
      return undefined;
    }
    const timer = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onExpired, seconds]);

  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="text-center">
      <p className="text-xs text-charcoal-700 dark:text-zinc-400 mb-0.5">Precio bloqueado por</p>
      <p className={`font-mono text-2xl font-bold tabular-nums ${seconds < 60 ? 'text-red-500 dark:text-red-400' : 'text-charcoal-950 dark:text-white'}`}>
        {min}:{sec}
      </p>
    </div>
  );
}

export default function CryptoPayment({ order, total }) {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { ethAmount, ethInGtq, loading: priceLoading, error: priceError } = useCryptoPrice(total);
  const {
    account,
    isConnected,
    isCorrectNetwork,
    error: mmError,
    connect,
    switchToSepolia,
    sendTransaction,
    setError: setMmError,
  } = useMetaMask();

  const [paymentData, setPaymentData] = useState(null);
  const [initiating, setInitiating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expired, setExpired] = useState(false);
  const [txHash, setTxHash] = useState(null);

  const verifySentPayment = async (hash) => {
    if (!paymentData?.paymentId || !hash) return;
    setVerifying(true);
    try {
      const { data } = await api.post('/payments/crypto/verify', {
        paymentId: paymentData.paymentId,
        txHash: hash,
      });
      toast.success('Pago confirmado en la blockchain.');
      clearCart();
      navigate('/order-confirmation', {
        state: { order: data.data.order ?? { ...order, status: data.data.status, txHash: hash } },
        replace: true,
      });
    } catch (err) {
      toast.error(err.message || 'La transaccion fue enviada, pero aun no se pudo confirmar. Reintenta la verificacion en unos minutos.');
    } finally {
      setVerifying(false);
    }
  };

  const initPayment = useCallback(async () => {
    if (!order?.id) return;
    setInitiating(true);
    setExpired(false);
    setPaymentData(null);
    try {
      const { data } = await api.post('/payments/crypto/initiate', { orderId: order.id });
      setPaymentData(data.data);
    } catch (err) {
      toast.error(err.message || 'No se pudo iniciar el pago cripto.');
    } finally {
      setInitiating(false);
    }
  }, [order?.id]);

  useEffect(() => {
    if (ethAmount && !paymentData && !initiating) initPayment();
  }, [ethAmount, paymentData, initiating, initPayment]);

  const handlePay = async () => {
    if (!paymentData || expired) return;
    setPaying(true);
    setMmError(null);
    try {
      const walletTo = paymentData.walletAddress ?? paymentData.walletTo;
      const hash = await sendTransaction({ to: walletTo, amountEth: paymentData.amountEth });
      setTxHash(hash);
      await verifySentPayment(hash);
    } catch (err) {
      const code = err.message;
      if (['ERR_C04', 'ERR_C05'].includes(code)) setMmError(code);
      else toast.error('Error al enviar la transaccion. Intenta de nuevo.');
    } finally {
      setPaying(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  if (priceLoading || initiating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner size="lg" />
        <p className="text-charcoal-800/75 dark:text-zinc-400 text-sm">
          {priceLoading ? 'Obteniendo precio de ETH...' : 'Iniciando sesion de pago...'}
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

  const walletTo = paymentData?.walletAddress ?? paymentData?.walletTo;
  const qrContent = walletTo && paymentData?.amountEth
    ? `ethereum:${walletTo}?value=${Math.round(parseFloat(paymentData.amountEth) * 1e18)}`
    : '';
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
          <p className="font-black text-blue-light text-xl">{paymentData?.amountEth ?? ethAmount ?? '-'} ETH</p>
          {ethInGtq && <p className="text-xs text-charcoal-700 dark:text-zinc-400 mt-0.5">1 ETH = {formatCurrency(ethInGtq)}</p>}
        </div>
        {paymentData && !expired && (
          <Countdown expiresAt={paymentData.expiresAt} onExpired={() => setExpired(true)} />
        )}
      </div>

      {expired && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
          <p className="text-red-700 dark:text-red-400 font-medium mb-2">El precio bloqueado expiro.</p>
          <Button size="sm" variant="danger" onClick={initPayment}>Renovar precio</Button>
        </div>
      )}

      {paymentData && !expired && (
        <div className="bg-white dark:bg-charcoal-900 border border-charcoal-100 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center gap-5">
          <p className="text-xs font-semibold text-charcoal-800/70 dark:text-zinc-400 uppercase tracking-widest">
            Opcion 1 - Escanea el QR con tu wallet
          </p>
          <div className="p-3 bg-white rounded-xl border border-charcoal-100">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(qrContent)}`}
              alt="Codigo QR para pago en ETH"
              width={QR_SIZE}
              height={QR_SIZE}
              className="rounded-lg"
            />
          </div>
          <div className="w-full space-y-3">
            {[
              { label: 'Direccion de destino', value: walletTo, copyLabel: 'Direccion' },
              { label: 'Monto exacto', value: `${paymentData.amountEth} ETH`, copyLabel: 'Monto' },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-xs text-charcoal-800/70 dark:text-zinc-400 mb-1">{field.label}</p>
                <div className="bg-charcoal-50 dark:bg-charcoal-900 rounded-xl p-3 flex items-center justify-between gap-2 border border-charcoal-100 dark:border-white/15">
                  <span className="font-mono text-xs text-charcoal-800 dark:text-zinc-300 truncate">{field.value}</span>
                  <button type="button" onClick={() => copyToClipboard(field.value, field.copyLabel)} className="text-blue-dark dark:text-blue-light hover:text-blue text-xs font-semibold flex-shrink-0 transition-colors">
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
              type="button"
              onClick={connect}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#f6851b] hover:bg-[#e2761b] active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-200 text-base"
            >
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
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-emerald-800 dark:text-emerald-400 text-sm font-bold mb-1">Transaccion enviada a la blockchain</p>
            <p className="font-mono text-xs text-emerald-700 dark:text-emerald-500 break-all">{txHash}</p>
          </div>
          <Button size="sm" variant="secondary" loading={verifying} onClick={() => verifySentPayment(txHash)}>
            Verificar pago de nuevo
          </Button>
        </div>
      )}
    </div>
  );
}
