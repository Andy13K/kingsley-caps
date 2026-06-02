const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate, trackingSchema } = require('../validators/shippingValidator');
const { addTracking, getTrackingInfo } = require('../controllers/shippingController');
const uploadTrackingImage = require('../middleware/uploadTrackingImage');

const router = Router();

router.put(
  '/orders/:orderId/tracking',
  authenticate,
  authorize('vendor', 'staff'),
  uploadTrackingImage.single('trackingImage'),
  validate(trackingSchema),
  addTracking
);
router.get('/orders/:orderId/tracking', authenticate, getTrackingInfo);

module.exports = router;
