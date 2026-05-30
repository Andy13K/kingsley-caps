const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const orderController = require('../controllers/orderController');
const {
  createOrderSchema,
  updateStatusSchema,
  trackingSchema,
  listOrdersSchema,
} = require('../utils/validators/orderValidator');

router.use(authenticate);

router.post(
  '/',
  authorize('customer'),
  validate(createOrderSchema),
  orderController.create
);
router.get('/my', authorize('customer'), validate(listOrdersSchema, 'query'), orderController.listMy);
router.get('/', validate(listOrdersSchema, 'query'), orderController.list);
router.get('/:id', orderController.getById);

router.put(
  '/:id/status',
  authorize('vendor', 'staff'),
  validate(updateStatusSchema),
  orderController.updateStatus
);
router.put(
  '/:id/tracking',
  authorize('vendor', 'staff'),
  validate(trackingSchema),
  orderController.setTracking
);
router.put(
  '/:id/cancel',
  authorize('customer', 'vendor'),
  orderController.cancel
);

module.exports = router;
