const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const uploadProductImages = require('../middleware/uploadProductImages');
const productController = require('../controllers/productController');
const {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} = require('../utils/validators/productValidator');

router.get('/', validate(listProductsSchema, 'query'), productController.list);
router.get('/vendor/mine', authenticate, authorize('vendor'), productController.listMine);
router.get('/:id', productController.getById);

router.post(
  '/images',
  authenticate,
  authorize('vendor'),
  uploadProductImages.array('images', 5),
  productController.uploadImages
);

router.post(
  '/:productId/try-on',
  authenticate,
  uploadProductImages.fields([
    { name: 'userPhoto', maxCount: 1 },
    { name: 'capImage', maxCount: 1 },
  ]),
  productController.tryOn
);

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
