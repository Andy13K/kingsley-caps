const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const uploadPaymentProof = require('../middleware/uploadPaymentProof');
const { validate, initiateSchema, verifySchema } = require('../validators/paymentValidator');
const {
  getCryptoPrice,
  initiateCryptoPayment,
  verifyCryptoPayment,
  submitTransferProof,
  approveTransferPayment,
  rejectTransferPayment,
  getPaymentByOrderId,
} = require('../controllers/paymentController');

const router = Router();

router.get('/crypto/price', getCryptoPrice);
router.post('/crypto/initiate', authenticate, validate(initiateSchema), initiateCryptoPayment);
router.post('/crypto/verify', authenticate, validate(verifySchema), verifyCryptoPayment);
router.post('/transfer/proof', authenticate, uploadPaymentProof.single('proof'), submitTransferProof);
router.put('/transfer/:paymentId/approve', authenticate, authorize('vendor', 'staff', 'superadmin'), approveTransferPayment);
router.put('/transfer/:paymentId/reject', authenticate, authorize('vendor', 'staff', 'superadmin'), rejectTransferPayment);
router.get('/:orderId', authenticate, getPaymentByOrderId);

module.exports = router;
