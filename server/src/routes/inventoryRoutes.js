const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { validate, adjustStockSchema, movementFiltersSchema } = require('../validators/inventoryValidator');
const { listVariants, getVariantStock, adjustStock, getAlerts, getMovements, getDemandPredictions } = require('../controllers/inventoryController');

const router = Router();

router.get('/variants', authenticate, authorize('vendor', 'staff', 'superadmin'), listVariants);
router.get('/variants/:variantId', authenticate, authorize('vendor', 'staff', 'superadmin'), getVariantStock);
router.put('/variants/:variantId/stock', authenticate, authorize('vendor', 'staff', 'superadmin'), validate(adjustStockSchema), adjustStock);
router.get('/alerts', authenticate, authorize('vendor', 'superadmin'), getAlerts);
router.get('/movements', authenticate, authorize('vendor', 'superadmin'), validate(movementFiltersSchema, 'query'), getMovements);

router.get('/demand-predictions', authenticate, authorize('vendor', 'staff', 'superadmin'), getDemandPredictions);

module.exports = router;
