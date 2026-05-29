const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate, trackingSchema } = require('../validators/shippingValidator');
const { addTracking, getTrackingInfo } = require('../controllers/shippingController');
const uploadShippingProof = require('../middleware/uploadShippingProof');

const router = Router();

router.put(
  '/orders/:orderId/tracking',
  authenticate,
  authorize('vendor', 'staff', 'superadmin'),
  uploadShippingProof.single('shippingProof'),
  validate(trackingSchema),
  addTracking
);
router.get('/orders/:orderId/tracking', authenticate, getTrackingInfo);

module.exports = router;
