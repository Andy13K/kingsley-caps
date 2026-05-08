const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const productController = require('../controllers/productController');
const {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} = require('../utils/validators/productValidator');

router.get('/', validate(listProductsSchema, 'query'), productController.list);
router.get('/:id', productController.getById);

router.post(
  '/',
  authenticate,
  authorize('vendor'),
  validate(createProductSchema),
  productController.create
);
router.put(
  '/:id',
  authenticate,
  authorize('vendor'),
  validate(updateProductSchema),
  productController.update
);
router.delete('/:id', authenticate, authorize('vendor'), productController.archive);

module.exports = router;
