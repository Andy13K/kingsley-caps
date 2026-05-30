const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const storeController = require('../controllers/storeController');
const {
  createStoreSchema,
  updateStoreSchema,
  cryptoConfigSchema,
} = require('../utils/validators/storeValidator');

router.get('/slug/:slug', storeController.getPublicBySlug);

router.use(authenticate);

router.post('/', authorize('vendor'), validate(createStoreSchema), storeController.create);
router.get('/my', authorize('vendor', 'staff'), storeController.getMine);
router.put('/my', authorize('vendor'), validate(updateStoreSchema), storeController.updateMine);
router.put('/:id', authorize('vendor'), validate(updateStoreSchema), storeController.update);
router.put(
  '/:id/crypto-config',
  authorize('vendor'),
  validate(cryptoConfigSchema),
  storeController.updateCryptoConfig
);
router.put('/:id/publish', authorize('vendor'), storeController.publish);

module.exports = router;
