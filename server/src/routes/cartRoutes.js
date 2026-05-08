const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const cartController = require('../controllers/cartController');
const {
  getCartSchema,
  addItemSchema,
  updateItemSchema,
  clearCartSchema,
} = require('../utils/validators/cartValidator');

router.use(authenticate, authorize('customer', 'vendor', 'staff'));

router.get('/', validate(getCartSchema, 'query'), cartController.getCart);
router.post('/items', validate(addItemSchema), cartController.addItem);
router.put('/items/:itemId', validate(updateItemSchema), cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', validate(clearCartSchema, 'query'), cartController.clearCart);

module.exports = router;
