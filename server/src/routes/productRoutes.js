const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const uploadProductImages = require('../middleware/uploadProductImages');
const productController = require('../controllers/productController');
const { suggestProductPrice } = require('../controllers/pricingController');
const {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} = require('../utils/validators/productValidator');

router.get('/', validate(listProductsSchema, 'query'), productController.list);
router.get('/vendor/mine', authenticate, authorize('vendor', 'superadmin'), productController.listMine);
router.post(
  '/suggest-price',
  authenticate,
  authorize('vendor', 'superadmin'),
  suggestProductPrice
);

router.get('/:id', productController.getById);

router.post(
  '/images',
  authenticate,
  authorize('vendor', 'superadmin'),
  uploadProductImages.array('images', 5),
  productController.uploadImages
);

router.post(
  '/:productId/try-on',
  uploadProductImages.fields([
    { name: 'userPhoto', maxCount: 1 },
  ]),
  productController.tryOn
);

router.post(
  '/',
  authenticate,
  authorize('vendor', 'superadmin'),
  validate(createProductSchema),
  productController.create
);
router.put(
  '/:id',
  authenticate,
  authorize('vendor', 'superadmin'),
  validate(updateProductSchema),
  productController.update
);
router.delete('/:id', authenticate, authorize('vendor', 'superadmin'), productController.archive);

module.exports = router;
