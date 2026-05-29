const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');
const priceService = require('../services/priceService');

const getCryptoPrice = asyncHandler(async (req, res) => {
  const rate = await priceService.getCryptoRate();
  res.json({ success: true, data: rate });
});

const initiateCryptoPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await paymentService.initiateCryptoPayment({ orderId, userId: req.user.id });
  res.status(201).json({ success: true, data: result });
});

const verifyCryptoPayment = asyncHandler(async (req, res) => {
  const { paymentId, txHash } = req.body;
  const result = await paymentService.verifyCryptoPayment({ paymentId, txHash, userId: req.user.id });
  res.json({ success: true, data: result });
});

const submitTransferProof = asyncHandler(async (req, res) => {
  const { orderId, reference } = req.body;
  const result = await paymentService.submitTransferProof({
    orderId,
    reference,
    file: req.file,
    userId: req.user.id,
  });
  res.status(201).json({ success: true, data: result });
});

const approveTransferPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const result = await paymentService.approveTransferPayment({ paymentId, user: req.user });
  res.json({ success: true, data: result });
});

const rejectTransferPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const result = await paymentService.rejectTransferPayment({ paymentId, user: req.user });
  res.json({ success: true, data: result });
});

const getPaymentByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const payment = await paymentService.getPaymentByOrderId({ orderId, userId: req.user.id });
  res.json({ success: true, data: { payment } });
});

module.exports = {
  getCryptoPrice,
  initiateCryptoPayment,
  verifyCryptoPayment,
  submitTransferProof,
  approveTransferPayment,
  rejectTransferPayment,
  getPaymentByOrderId,
};
