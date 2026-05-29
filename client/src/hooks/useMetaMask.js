import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Test Network',
  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const METAMASK_ERRORS = {
  ERR_C01: 'MetaMask no está instalado. Por favor instálalo para continuar.',
  ERR_C02: 'Conexión rechazada. Acepta la solicitud en MetaMask.',
  ERR_C03: 'Red incorrecta. Debes usar la red Sepolia Testnet.',
  ERR_C04: 'Fondos insuficientes en tu wallet.',
  ERR_C05: 'Transacción cancelada por el usuario.',
  ERR_C06: 'Tiempo de confirmación agotado.',
  CONNECTION_ERROR: 'Error al conectar con MetaMask.',
};

export const useMetaMask = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setIsConnected(false);
      } else {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (id) => setChainId(id);

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.request({ method: 'eth_chainId' }).then(setChainId);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);

    if (!window.ethereum) {
      setError('ERR_C01');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const id = await window.ethereum.request({ method: 'eth_chainId' });

      setAccount(accounts[0]);
      setChainId(id);
      setIsConnected(true);

      if (id !== SEPOLIA_CHAIN_ID) {
        setError('ERR_C03');
      }
    } catch (err) {
      setError(err.code === 4001 ? 'ERR_C02' : 'CONNECTION_ERROR');
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) {
      setError('ERR_C01');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setChainId(SEPOLIA_CHAIN_ID);
      setError(null);
    } catch (err) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_PARAMS],
          });
          setChainId(SEPOLIA_CHAIN_ID);
          setError(null);
          return;
        } catch {
          setError('ERR_C03');
          return;
        }
      }
      setError(err.code === 4001 ? 'ERR_C02' : 'ERR_C03');
    }
  }, []);

  const sendTransaction = useCallback(async ({ to, amountEth }) => {
    if (!window.ethereum) throw new Error('ERR_C01');

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(String(amountEth)),
      });
      return tx.hash;
    } catch (err) {
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') throw new Error('ERR_C05');
      if (err.code === 'INSUFFICIENT_FUNDS') throw new Error('ERR_C04');
      throw err;
    }
  }, []);

  return {
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    error,
    errorMessage: error ? METAMASK_ERRORS[error] : null,
    connect,
    switchToSepolia,
    sendTransaction,
    setError,
  };
};
