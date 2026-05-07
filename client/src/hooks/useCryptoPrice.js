import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';

const FALLBACK_ETH_RATE_GTQ = 7500;

export const useCryptoPrice = (gtqAmount) => {
  const [ethAmount, setEthAmount] = useState(null);
  const [ethInGtq, setEthInGtq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const applyRate = useCallback((rate) => {
    setEthInGtq(rate);
    setEthAmount((gtqAmount / rate).toFixed(8));
    setLastUpdated(new Date());
  }, [gtqAmount]);

  const fetchPrice = useCallback(async () => {
    if (!gtqAmount) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/payments/crypto/price');
      applyRate(data.data.ethInGtq);
    } catch {
      try {
        const { data } = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=gtq',
          { timeout: 5000 }
        );
        const rate = data?.ethereum?.gtq;
        if (rate && rate > 0) applyRate(rate);
        else applyRate(FALLBACK_ETH_RATE_GTQ);
      } catch {
        applyRate(FALLBACK_ETH_RATE_GTQ);
      }
    } finally {
      setLoading(false);
    }
  }, [gtqAmount, applyRate]);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { ethAmount, ethInGtq, loading, error, lastUpdated, refetch: fetchPrice };
};
