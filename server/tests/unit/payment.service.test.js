jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

jest.mock('../../src/models', () => ({
  Order: { findOne: jest.fn() },
  Store: {},
  PaymentTransaction: { create: jest.fn(), findOne: jest.fn() },
  Notification: { create: jest.fn() },
  User: { findOne: jest.fn() },
}));

jest.mock('../../src/services/blockchainService', () => ({
  verifyTransaction: jest.fn(),
}));

jest.mock('../../src/services/priceService', () => ({
  getCryptoRate: jest.fn(),
}));

jest.mock('../../src/utils/AppError', () => {
  return class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  };
});

const { Order, PaymentTransaction, Notification, User } = require('../../src/models');
const blockchainService = require('../../src/services/blockchainService');
const priceService = require('../../src/services/priceService');
const paymentService = require('../../src/services/paymentService');

const WALLET_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const TX_HASH = '0x' + 'b'.repeat(64);

describe('paymentService.initiateCryptoPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initiates crypto payment and returns payment details', async () => {
    const mockOrder = {
      id: 'order-uuid',
      customer_id: 'user-uuid',
      status: 'pending_payment',
      total: 700.0,
      currency: 'GTQ',
      store_id: 'store-uuid',
      Store: {
        crypto_enabled: true,
        eth_wallet_address: WALLET_ADDRESS,
      },
    };
    Order.findOne.mockResolvedValue(mockOrder);
    priceService.getCryptoRate.mockResolvedValue({ eth_gtq: 3500.0, updatedAt: new Date().toISOString() });
    PaymentTransaction.create.mockResolvedValue({
      id: 'payment-uuid',
      rate_locked_at: new Date(),
      network: 'sepolia',
      nonce: 'kc_abc1234567890123',
    });

    const result = await paymentService.initiateCryptoPayment({
      orderId: 'order-uuid',
      userId: 'user-uuid',
    });

    expect(result.paymentId).toBe('payment-uuid');
    expect(result.walletAddress).toBe(WALLET_ADDRESS);
    expect(result.amountEth).toBe('0.20000000'); // 700 / 3500
    expect(result.amountGtq).toBe(700.0);
    expect(result.network).toBe('sepolia');
    expect(result.qrData).toContain(WALLET_ADDRESS);
    expect(PaymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: 'order-uuid',
        method: 'crypto_eth',
        amount_fiat: 700.0,
        crypto_currency: 'ETH',
      })
    );
  });

  test('throws AppError when order is not in pending_payment status', async () => {
    Order.findOne.mockResolvedValue({
      id: 'order-uuid',
      customer_id: 'user-uuid',
      status: 'paid',
      Store: { crypto_enabled: true, eth_wallet_address: WALLET_ADDRESS },
    });

    await expect(
      paymentService.initiateCryptoPayment({ orderId: 'order-uuid', userId: 'user-uuid' })
    ).rejects.toThrow('La orden no está pendiente de pago');
  });

  test('throws AppError when crypto is not enabled in the store', async () => {
    Order.findOne.mockResolvedValue({
      id: 'order-uuid',
      customer_id: 'user-uuid',
      status: 'pending_payment',
      total: 500,
      Store: { crypto_enabled: false, eth_wallet_address: null },
    });

    await expect(
      paymentService.initiateCryptoPayment({ orderId: 'order-uuid', userId: 'user-uuid' })
    ).rejects.toThrow('Pagos crypto no habilitados');
  });

  test('throws AppError when store has no wallet address configured', async () => {
    Order.findOne.mockResolvedValue({
      id: 'order-uuid',
      customer_id: 'user-uuid',
      status: 'pending_payment',
      total: 500,
      Store: { crypto_enabled: true, eth_wallet_address: null },
    });

    await expect(
      paymentService.initiateCryptoPayment({ orderId: 'order-uuid', userId: 'user-uuid' })
    ).rejects.toThrow('dirección de wallet');
  });

  test('throws AppError when order does not belong to user', async () => {
    Order.findOne.mockResolvedValue({
      id: 'order-uuid',
      customer_id: 'other-user-uuid',
      status: 'pending_payment',
      Store: { crypto_enabled: true, eth_wallet_address: WALLET_ADDRESS },
    });

    await expect(
      paymentService.initiateCryptoPayment({ orderId: 'order-uuid', userId: 'user-uuid' })
    ).rejects.toThrow('No tienes acceso');
  });
});

describe('paymentService.verifyCryptoPayment', () => {
  const buildMockPayment = (overrides = {}) => ({
    id: 'payment-uuid',
    order_id: 'order-uuid',
    store_id: 'store-uuid',
    wallet_to: WALLET_ADDRESS,
    amount_crypto: '0.20000000',
    network: 'sepolia',
    status: 'pending',
    expires_at: new Date(Date.now() + 600000),
    Order: {
      customer_id: 'user-uuid',
      update: jest.fn().mockResolvedValue(true),
    },
    update: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('confirms payment when blockchain verification succeeds', async () => {
    const mockPayment = buildMockPayment();
    PaymentTransaction.findOne.mockResolvedValue(mockPayment);
    blockchainService.verifyTransaction.mockResolvedValue({
      verified: true,
      confirmations: 5,
      blockNumber: 1000,
      txHash: TX_HASH,
    });

    const result = await paymentService.verifyCryptoPayment({
      paymentId: 'payment-uuid',
      txHash: TX_HASH,
      userId: 'user-uuid',
    });

    expect(result.orderId).toBe('order-uuid');
    expect(result.status).toBe('paid');
    expect(result.confirmedAt).toBeDefined();
    expect(mockPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed', tx_hash: TX_HASH, confirmations: 5 })
    );
    expect(mockPayment.Order.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid', payment_method: 'crypto_eth' })
    );
  });

  test('handles ERR-C06 discrepancy: updates status and creates admin notification', async () => {
    const mockPayment = buildMockPayment();
    PaymentTransaction.findOne.mockResolvedValue(mockPayment);
    blockchainService.verifyTransaction.mockResolvedValue({
      verified: false,
      error: 'AMOUNT_DISCREPANCY',
      code: 'ERR-C06',
      received: '0.10',
    });
    User.findOne.mockResolvedValue({ id: 'superadmin-uuid' });
    Notification.create.mockResolvedValue({});

    await expect(
      paymentService.verifyCryptoPayment({
        paymentId: 'payment-uuid',
        txHash: TX_HASH,
        userId: 'user-uuid',
      })
    ).rejects.toThrow('Discrepancia en el monto enviado');

    expect(mockPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'discrepancy', tx_hash: TX_HASH })
    );
    expect(User.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'superadmin' } })
    );
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'superadmin-uuid',
        type: 'payment_discrepancy',
      })
    );
  });

  test('throws AppError with correct message for ERR-C04 insufficient confirmations', async () => {
    const mockPayment = buildMockPayment();
    PaymentTransaction.findOne.mockResolvedValue(mockPayment);
    blockchainService.verifyTransaction.mockResolvedValue({
      verified: false,
      error: 'INSUFFICIENT_CONFIRMATIONS',
      code: 'ERR-C04',
      confirmations: 1,
      required: 3,
    });

    await expect(
      paymentService.verifyCryptoPayment({
        paymentId: 'payment-uuid',
        txHash: TX_HASH,
        userId: 'user-uuid',
      })
    ).rejects.toThrow('Confirmaciones insuficientes');
  });

  test('throws ERR-C05 AppError when payment has expired', async () => {
    const expiredPayment = buildMockPayment({
      expires_at: new Date(Date.now() - 1000),
    });
    PaymentTransaction.findOne.mockResolvedValue(expiredPayment);

    await expect(
      paymentService.verifyCryptoPayment({
        paymentId: 'payment-uuid',
        txHash: TX_HASH,
        userId: 'user-uuid',
      })
    ).rejects.toThrow('expirado');
  });
});
