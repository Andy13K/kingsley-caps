const { v4: uuidv4 } = require('uuid');
const { Order, Store, PaymentTransaction, Notification, User } = require('../models');
const blockchainService = require('./blockchainService');
const priceService = require('./priceService');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// TODO: use inventoryService for stock reservation/release when integrated
// const inventoryService = require('./inventoryService');

const CRYPTO_ERROR_MESSAGES = {
  'ERR-C01': 'Transacción no encontrada en la blockchain',
  'ERR-C02': 'Destinatario de la transacción incorrecto',
  'ERR-C03': 'La transacción aún no tiene recibo (posiblemente pendiente)',
  'ERR-C04': 'Confirmaciones insuficientes, intente de nuevo en unos minutos',
  'ERR-C05': 'El tiempo para completar el pago ha expirado',
  'ERR-C06': 'Discrepancia en el monto enviado',
};

const initiateCryptoPayment = async ({ orderId, userId }) => {
  const order = await Order.findOne({
    where: { id: orderId },
    include: [{ model: Store }],
  });

  if (!order) throw new AppError('Orden no encontrada', 404);
  if (order.customer_id !== userId) throw new AppError('No tienes acceso a esta orden', 403);
  if (order.status !== 'pending_payment') throw new AppError('La orden no está pendiente de pago', 400);
  if (!order.Store || !order.Store.crypto_enabled) {
    throw new AppError('Pagos crypto no habilitados en esta tienda', 400);
  }
  if (!order.Store.eth_wallet_address) {
    throw new AppError('La tienda no tiene dirección de wallet configurada', 400);
  }

  const rate = await priceService.getCryptoRate();
  const amountEth = (order.total / rate.eth_gtq).toFixed(8);
  const nonce = `kc_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const walletAddress = order.Store.eth_wallet_address;

  const payment = await PaymentTransaction.create({
    order_id: orderId,
    store_id: order.store_id,
    method: 'crypto_eth',
    amount_fiat: order.total,
    currency_fiat: order.currency || 'GTQ',
    amount_crypto: parseFloat(amountEth),
    crypto_currency: 'ETH',
    exchange_rate: rate.eth_gtq,
    rate_locked_at: new Date(),
    wallet_to: walletAddress,
    network: process.env.ETH_NETWORK || 'sepolia',
    nonce,
    initiated_at: new Date(),
    expires_at: expiresAt,
  });

  logger.info(`Crypto payment initiated: ${payment.id} for order ${orderId}`);

  return {
    paymentId: payment.id,
    walletAddress,
    amountEth,
    amountGtq: order.total,
    exchangeRate: rate.eth_gtq,
    rateLockedAt: payment.rate_locked_at,
    expiresAt,
    nonce,
    network: payment.network,
    qrData: `ethereum:${walletAddress}?amount=${amountEth}&memo=${nonce}`,
  };
};

const verifyCryptoPayment = async ({ paymentId, txHash, userId }) => {
  const payment = await PaymentTransaction.findOne({
    where: { id: paymentId },
    include: [
      { model: Order },
      { model: Store },
    ],
  });

  if (!payment) throw new AppError('Pago no encontrado', 404);

  if (new Date() > new Date(payment.expires_at)) {
    await payment.update({ status: 'failed' });
    throw new AppError(CRYPTO_ERROR_MESSAGES['ERR-C05'], 400);
  }

  if (payment.status !== 'pending') {
    throw new AppError('El pago ya fue procesado anteriormente', 400);
  }

  if (payment.Order.customer_id !== userId) {
    throw new AppError('No tienes acceso a este pago', 403);
  }

  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!txHashRegex.test(txHash)) {
    throw new AppError('Formato de hash de transacción inválido', 400);
  }

  const result = await blockchainService.verifyTransaction({
    txHash,
    expectedTo: payment.wallet_to,
    expectedAmountEth: String(payment.amount_crypto),
    network: payment.network,
  });

  if (result.code === 'ERR-C06') {
    await payment.update({ status: 'discrepancy', tx_hash: txHash });

    const superadmin = await User.findOne({ where: { role: 'superadmin' }, attributes: ['id'] });
    if (superadmin) {
      await Notification.create({
        user_id: superadmin.id,
        store_id: payment.store_id,
        type: 'payment_discrepancy',
        title: 'Discrepancia en pago crypto',
        message: `Pago ${payment.id} con discrepancia: esperado ${payment.amount_crypto} ETH, recibido ${result.received} ETH`,
        metadata: {
          paymentId: payment.id,
          txHash,
          expected: payment.amount_crypto,
          received: result.received,
        },
      });
    }

    logger.warn(`Payment discrepancy detected for payment ${paymentId}`);
    throw new AppError(CRYPTO_ERROR_MESSAGES['ERR-C06'], 400);
  }

  if (!result.verified) {
    const message = CRYPTO_ERROR_MESSAGES[result.code] || 'Error de verificación blockchain';
    throw new AppError(message, 400);
  }

  const confirmedAt = new Date();

  await payment.update({
    status: 'confirmed',
    tx_hash: txHash,
    confirmations: result.confirmations,
    block_number: result.blockNumber,
    confirmed_at: confirmedAt,
  });

  await payment.Order.update({
    status: 'paid',
    paid_at: confirmedAt,
    payment_method: 'crypto_eth',
  });

  logger.info(`Payment ${paymentId} confirmed for order ${payment.order_id}`);

  return {
    orderId: payment.order_id,
    status: 'paid',
    confirmedAt,
  };
};

const getPaymentByOrderId = async ({ orderId, userId }) => {
  const payment = await PaymentTransaction.findOne({
    where: { order_id: orderId },
    include: [{ model: Order }],
    order: [['created_at', 'DESC']],
  });

  if (!payment) throw new AppError('Pago no encontrado', 404);
  if (payment.Order.customer_id !== userId) throw new AppError('No tienes acceso a este pago', 403);

  return payment;
};

module.exports = { initiateCryptoPayment, verifyCryptoPayment, getPaymentByOrderId };
