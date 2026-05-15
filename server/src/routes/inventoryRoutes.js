const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate, adjustStockSchema, movementFiltersSchema } = require('../validators/inventoryValidator');
const { listVariants, getVariantStock, adjustStock, getAlerts, getMovements } = require('../controllers/inventoryController');

const router = Router();

router.get('/variants', authenticate, authorize('vendor', 'staff'), listVariants);
router.get('/variants/:variantId', authenticate, authorize('vendor', 'staff'), getVariantStock);
router.put('/variants/:variantId/stock', authenticate, authorize('vendor', 'staff'), validate(adjustStockSchema), adjustStock);
router.get('/alerts', authenticate, authorize('vendor'), getAlerts);
router.get('/movements', authenticate, authorize('vendor'), validate(movementFiltersSchema, 'query'), getMovements);

module.exports = router;
