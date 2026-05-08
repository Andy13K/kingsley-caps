const axios = require('axios');
const logger = require('../utils/logger');

let cachedRate = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000;

const getCryptoRate = async () => {
  const now = Date.now();
  if (cachedRate && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) return cachedRate;

  const response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=gtq',
    { timeout: 5000 }
  );
  const eth_gtq = response.data.ethereum.gtq;
  cachedRate = { eth_gtq, updatedAt: new Date().toISOString() };
  cacheTimestamp = now;
  logger.info(`ETH/GTQ rate updated: ${eth_gtq}`);
  return cachedRate;
};

const convertGtqToEth = async (amountGtq) => {
  const { eth_gtq } = await getCryptoRate();
  return (amountGtq / eth_gtq).toFixed(8);
};

module.exports = { getCryptoRate, convertGtqToEth };
