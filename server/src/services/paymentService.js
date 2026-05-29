const { v4: uuidv4 } = require('uuid');
const { Order, Store, PaymentTransaction, Notification, User } = require('../models');
const blockchainService = require('./blockchainService');
const priceService = require('./priceService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

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

  if (!order) {throw new AppError('Orden no encontrada', 404);}
  if (order.customer_id !== userId) {throw new AppError('No tienes acceso a esta orden', 403);}
  if (order.status !== 'pending_payment') {throw new AppError('La orden no está pendiente de pago', 400);}
  if (!order.Store || !order.Store.crypto_enabled) {
    throw new AppError('Pagos crypto no habilitados en esta tienda', 400);
  }
  if (!order.Store.eth_wallet_address) {
    throw new AppError('La tienda no tiene dirección de wallet configurada', 400);
  }

  const existingPayment = await PaymentTransaction.findOne({
    where: { order_id: orderId, status: 'pending' },
    order: [['created_at', 'DESC']],
  });
  if (existingPayment && new Date() <= new Date(existingPayment.expires_at)) {
    const amountEth = Number(existingPayment.amount_crypto).toFixed(8);
    return {
      paymentId: existingPayment.id,
      walletAddress: existingPayment.wallet_to,
      walletTo: existingPayment.wallet_to,
      amountEth,
      amountGtq: existingPayment.amount_fiat,
      exchangeRate: existingPayment.exchange_rate,
      rateLockedAt: existingPayment.rate_locked_at,
      expiresAt: existingPayment.expires_at,
      nonce: existingPayment.nonce,
      network: existingPayment.network,
      qrData: `ethereum:${existingPayment.wallet_to}?amount=${amountEth}&memo=${existingPayment.nonce}`,
    };
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
    walletTo: walletAddress,
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

  if (!payment) {throw new AppError('Pago no encontrado', 404);}

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
    try {
      await notificationService.createDiscrepancyAlert({ payment, order: payment.Order });
    } catch (err) {
      logger.error(`Could not create discrepancy notification for payment ${paymentId}: ${err.message}`);
      const superadmin = typeof User.findOne === 'function'
        ? await User.findOne({ where: { role: 'superadmin' }, attributes: ['id'] })
        : null;
      if (superadmin && typeof Notification.create === 'function') {
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
  if (typeof payment.Order.reload === 'function') {
    await payment.Order.reload();
  } else {
    payment.Order.status = 'paid';
    payment.Order.paid_at = confirmedAt;
    payment.Order.payment_method = 'crypto_eth';
  }
  try {
    await notificationService.createPaymentConfirmedNotification({ order: payment.Order, payment });
  } catch (err) {
    logger.error(`Could not create payment notification for payment ${paymentId}: ${err.message}`);
  }

  logger.info(`Payment ${paymentId} confirmed for order ${payment.order_id}`);

  return {
    orderId: payment.order_id,
    order: payment.Order,
    payment,
    status: 'paid',
    confirmedAt,
  };
};

const assertCanReviewStorePayment = (payment, user) => {
  if (!payment?.Store) {
    throw new AppError('Tienda no encontrada para este pago', 404);
  }
  if (user.role === 'superadmin') {
    return;
  }
  if (['vendor', 'staff', 'superadmin'].includes(user.role) && payment.Store.vendor_id === user.id) {
    return;
  }
  throw new AppError('No tienes acceso a validar este pago', 403);
};

const findTransferPaymentForReview = async (paymentId) => {
  const payment = await PaymentTransaction.findOne({
    where: { id: paymentId, method: 'transfer' },
    include: [{ model: Order }, { model: Store }],
  });
  if (!payment) throw new AppError('Pago por transferencia no encontrado', 404);
  return payment;
};

const submitTransferProof = async ({ orderId, userId, file, reference }) => {
  if (!file) {
    throw new AppError('Debes adjuntar un comprobante de pago', 400);
  }

  const order = await Order.findOne({
    where: { id: orderId },
    include: [{ model: Store }],
  });

  if (!order) throw new AppError('Orden no encontrada', 404);
  if (order.customer_id !== userId) throw new AppError('No tienes acceso a esta orden', 403);
  if (order.payment_method !== 'transfer') throw new AppError('Esta orden no usa transferencia bancaria', 400);
  if (order.status !== 'pending_payment') throw new AppError('Esta orden ya no esta pendiente de pago', 400);

  const proofUrl = `/uploads/proofs/${file.filename}`;
  const [payment] = await PaymentTransaction.findOrCreate({
    where: { order_id: orderId, method: 'transfer' },
    defaults: {
      order_id: orderId,
      store_id: order.store_id,
      method: 'transfer',
      amount_fiat: order.total,
      currency_fiat: order.currency || 'GTQ',
      status: 'pending',
      initiated_at: new Date(),
    },
  });

  await payment.update({
    amount_fiat: order.total,
    currency_fiat: order.currency || 'GTQ',
    status: 'pending',
    transfer_proof_url: proofUrl,
    transfer_reference: reference || null,
    submitted_at: new Date(),
  });

  if (order.Store?.vendor_id) {
    await notificationService.createNotification({
      userId: order.Store.vendor_id,
      storeId: order.store_id,
      type: 'transfer_proof_submitted',
      title: 'Comprobante recibido',
      message: `El cliente subio comprobante para el pedido #${String(order.id).slice(0, 8).toUpperCase()}.`,
      metadata: { orderId: order.id, paymentId: payment.id, proofUrl },
    });
  }

  return { order, payment };
};

const approveTransferPayment = async ({ paymentId, user }) => {
  const payment = await findTransferPaymentForReview(paymentId);
  assertCanReviewStorePayment(payment, user);
  if (!payment.transfer_proof_url) {
    throw new AppError('Este pago aun no tiene comprobante adjunto', 400);
  }
  if (payment.status === 'confirmed') {
    return { order: payment.Order, payment };
  }

  const confirmedAt = new Date();
  await payment.update({
    status: 'confirmed',
    reviewed_at: confirmedAt,
    reviewed_by: user.id,
    confirmed_at: confirmedAt,
  });
  await payment.Order.update({
    status: 'paid',
    paid_at: confirmedAt,
    payment_method: 'transfer',
  });
  await payment.Order.reload();

  await notificationService.createPaymentConfirmedNotification({ order: payment.Order, payment });
  return { order: payment.Order, payment };
};

const rejectTransferPayment = async ({ paymentId, user }) => {
  const payment = await findTransferPaymentForReview(paymentId);
  assertCanReviewStorePayment(payment, user);

  await payment.update({
    status: 'failed',
    reviewed_at: new Date(),
    reviewed_by: user.id,
  });

  await notificationService.createNotification({
    userId: payment.Order.customer_id,
    storeId: payment.store_id,
    type: 'transfer_proof_rejected',
    title: 'Comprobante rechazado',
    message: `El comprobante del pedido #${String(payment.order_id).slice(0, 8).toUpperCase()} fue rechazado. Puedes subir uno nuevo.`,
    metadata: { orderId: payment.order_id, paymentId: payment.id },
  });

  return { order: payment.Order, payment };
};

const getPaymentByOrderId = async ({ orderId, userId }) => {
  const payment = await PaymentTransaction.findOne({
    where: { order_id: orderId },
    include: [{ model: Order }],
    order: [['created_at', 'DESC']],
  });

  if (!payment) {throw new AppError('Pago no encontrado', 404);}
  if (payment.Order.customer_id !== userId) {throw new AppError('No tienes acceso a este pago', 403);}

  return payment;
};

module.exports = {
  initiateCryptoPayment,
  verifyCryptoPayment,
  submitTransferProof,
  approveTransferPayment,
  rejectTransferPayment,
  getPaymentByOrderId,
};
