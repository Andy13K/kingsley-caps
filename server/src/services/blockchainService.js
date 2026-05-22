const { ethers } = require('ethers');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETH_RPC_URL || 'https://rpc.sepolia.org'
    );
    this.confirmationsRequired = parseInt(process.env.ETH_CONFIRMATIONS_REQUIRED || '3');
  }

  async verifyTransaction({ txHash, expectedTo, expectedAmountEth }) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return { verified: false, error: 'TX_NOT_FOUND', code: 'ERR-C01' };
      }

      if (tx.to.toLowerCase() !== expectedTo.toLowerCase()) {
        return { verified: false, error: 'WRONG_RECIPIENT', code: 'ERR-C02' };
      }

      const expectedWei = ethers.parseEther(String(expectedAmountEth));
      const tolerance = expectedWei / BigInt(100);
      if (tx.value < expectedWei - tolerance) {
        return {
          verified: false,
          error: 'AMOUNT_DISCREPANCY',
          code: 'ERR-C06',
          received: ethers.formatEther(tx.value),
        };
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { verified: false, error: 'NO_RECEIPT', code: 'ERR-C03' };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - Number(receipt.blockNumber) + 1;

      if (confirmations < this.confirmationsRequired) {
        return {
          verified: false,
          error: 'INSUFFICIENT_CONFIRMATIONS',
          code: 'ERR-C04',
          confirmations,
          required: this.confirmationsRequired,
        };
      }

      return {
        verified: true,
        confirmations,
        blockNumber: Number(receipt.blockNumber),
        txHash,
      };
    } catch (err) {
      logger.error('BlockchainService.verifyTransaction error:', { message: err.message });
      throw err;
    }
  }

  async isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

module.exports = new BlockchainService();
