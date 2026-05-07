const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');
const priceService = require('../services/priceService');

const getCryptoPrice = asyncHandler(async (req, res) => {
  const rate = await priceService.getCryptoRate();
  res.json({ success: true, data: rate });
});

const initiateCryptoPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.initiateCryptoPayment({ orderId: req.body.orderId, userId: req.user.id });
  res.status(201).json({ success: true, data: result });
});

const verifyCryptoPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyCryptoPayment({ paymentId: req.body.paymentId, txHash: req.body.txHash, userId: req.user.id });
  res.json({ success: true, data: result });
});

const getPaymentByOrderId = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentByOrderId({ orderId: req.params.orderId, userId: req.user.id });
  res.json({ success: true, data: { payment } });
});

module.exports = { getCryptoPrice, initiateCryptoPayment, verifyCryptoPayment, getPaymentByOrderId };
