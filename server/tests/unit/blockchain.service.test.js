jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

// Factory creates mockProvider accessible via _mockProvider export
jest.mock('ethers', () => {
  const mockProvider = {
    getTransaction: jest.fn(),
    getTransactionReceipt: jest.fn(),
    getBlockNumber: jest.fn(),
  };
  return {
    ethers: {
      JsonRpcProvider: jest.fn(() => mockProvider),
      parseEther: (val) => BigInt(Math.round(parseFloat(val) * 1e18)),
      formatEther: (val) => (Number(val) / 1e18).toString(),
      isAddress: (addr) => /^0x[0-9a-fA-F]{40}$/.test(addr),
    },
    _mockProvider: mockProvider,
  };
});

const { _mockProvider: provider } = require('ethers');
const blockchainService = require('../../src/services/blockchainService');

const EXPECTED_TO = '0xabcdef1234567890abcdef1234567890abcdef12';
const EXPECTED_AMOUNT_ETH = '0.1';
const TX_HASH = '0x' + 'a'.repeat(64);
const EXACT_VALUE = BigInt(100000000000000000); // 0.1 ETH in wei

describe('BlockchainService.verifyTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns verified=true with sufficient confirmations', async () => {
    provider.getTransaction.mockResolvedValue({
      to: EXPECTED_TO,
      value: EXACT_VALUE,
    });
    provider.getTransactionReceipt.mockResolvedValue({ blockNumber: BigInt(1000) });
    provider.getBlockNumber.mockResolvedValue(1003);

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(true);
    expect(result.confirmations).toBe(4); // 1003 - 1000 + 1
    expect(result.blockNumber).toBe(1000);
    expect(result.txHash).toBe(TX_HASH);
  });

  test('returns ERR-C01 TX_NOT_FOUND when transaction does not exist', async () => {
    provider.getTransaction.mockResolvedValue(null);

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(false);
    expect(result.error).toBe('TX_NOT_FOUND');
    expect(result.code).toBe('ERR-C01');
  });

  test('returns ERR-C02 WRONG_RECIPIENT when destination address differs', async () => {
    provider.getTransaction.mockResolvedValue({
      to: '0x0000000000000000000000000000000000000001',
      value: EXACT_VALUE,
    });

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(false);
    expect(result.error).toBe('WRONG_RECIPIENT');
    expect(result.code).toBe('ERR-C02');
  });

  test('returns ERR-C06 AMOUNT_DISCREPANCY when value is below 1% tolerance', async () => {
    // 0.08 ETH is below 0.099 ETH (0.1 - 1% tolerance)
    const lowValue = BigInt(80000000000000000);
    provider.getTransaction.mockResolvedValue({
      to: EXPECTED_TO,
      value: lowValue,
    });

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(false);
    expect(result.error).toBe('AMOUNT_DISCREPANCY');
    expect(result.code).toBe('ERR-C06');
    expect(result.received).toBeDefined();
  });

  test('returns ERR-C03 NO_RECEIPT when receipt is not yet available', async () => {
    provider.getTransaction.mockResolvedValue({
      to: EXPECTED_TO,
      value: EXACT_VALUE,
    });
    provider.getTransactionReceipt.mockResolvedValue(null);

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(false);
    expect(result.error).toBe('NO_RECEIPT');
    expect(result.code).toBe('ERR-C03');
  });

  test('returns ERR-C04 INSUFFICIENT_CONFIRMATIONS when blocks are too few', async () => {
    provider.getTransaction.mockResolvedValue({
      to: EXPECTED_TO,
      value: EXACT_VALUE,
    });
    provider.getTransactionReceipt.mockResolvedValue({ blockNumber: BigInt(1000) });
    provider.getBlockNumber.mockResolvedValue(1001); // only 2 confirmations, need 3

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(false);
    expect(result.error).toBe('INSUFFICIENT_CONFIRMATIONS');
    expect(result.code).toBe('ERR-C04');
    expect(result.confirmations).toBe(2);
    expect(result.required).toBe(3);
  });

  test('accepts amount within 1% tolerance (just at threshold)', async () => {
    // 0.0991 ETH is within 1% of 0.1 ETH (threshold = 0.099)
    const withinTolerance = BigInt(99100000000000000);
    provider.getTransaction.mockResolvedValue({
      to: EXPECTED_TO,
      value: withinTolerance,
    });
    provider.getTransactionReceipt.mockResolvedValue({ blockNumber: BigInt(1000) });
    provider.getBlockNumber.mockResolvedValue(1003);

    const result = await blockchainService.verifyTransaction({
      txHash: TX_HASH,
      expectedTo: EXPECTED_TO,
      expectedAmountEth: EXPECTED_AMOUNT_ETH,
      network: 'sepolia',
    });

    expect(result.verified).toBe(true);
  });
});

describe('BlockchainService.isValidAddress', () => {
  test('returns true for a valid 42-char Ethereum address', async () => {
    const result = await blockchainService.isValidAddress(EXPECTED_TO);
    expect(result).toBe(true);
  });

  test('returns false for an invalid address', async () => {
    const result = await blockchainService.isValidAddress('not-an-address');
    expect(result).toBe(false);
  });

  test('returns false for an address without 0x prefix', async () => {
    const result = await blockchainService.isValidAddress('abcdef1234567890abcdef1234567890abcdef12');
    expect(result).toBe(false);
  });
});
