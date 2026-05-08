export const formatCurrency = (amount, currency = 'GTQ') =>
  new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

export const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat('es-GT', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(date))
    : '-';

export const formatEthAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEth = (amount) => `${parseFloat(amount).toFixed(6)} ETH`;

export const ORDER_STATUS_LABEL = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  preparing: 'Preparando',
  packed: 'Empacado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export const ORDER_STATUS_COLOR = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};
