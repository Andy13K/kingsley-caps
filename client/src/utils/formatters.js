export const formatCurrency = (amount, currency = 'GTQ') =>
  new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export const formatDate = (dateString) =>
  new Intl.DateTimeFormat('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));

export const formatEthAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEth = (amount) => `${parseFloat(amount).toFixed(6)} ETH`;
