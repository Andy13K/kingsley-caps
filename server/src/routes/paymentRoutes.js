const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { validate, initiateSchema, verifySchema } = require('../validators/paymentValidator');
const {
  getCryptoPrice,
  initiateCryptoPayment,
  verifyCryptoPayment,
  getPaymentByOrderId,
} = require('../controllers/paymentController');

const router = Router();

router.get('/crypto/price', getCryptoPrice);
router.post('/crypto/initiate', authenticate, validate(initiateSchema), initiateCryptoPayment);
router.post('/crypto/verify', authenticate, validate(verifySchema), verifyCryptoPayment);
router.get('/:orderId', authenticate, getPaymentByOrderId);

module.exports = router;
