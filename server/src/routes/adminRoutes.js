const router = require('express').Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const adminController = require('../controllers/adminController');

router.use(authenticate, authorize('superadmin'));

router.get('/stores', adminController.listStores);
router.get('/dashboard', adminController.metrics);
router.get('/metrics', adminController.metrics);
router.get('/inventory', adminController.inventory);
router.put('/stores/:id/approve', adminController.approveStore);
router.put('/stores/:id/suspend', adminController.suspendStore);
router.put('/stores/:id/reactivate', adminController.reactivateStore);

router.get('/products', adminController.listProducts);
router.put('/products/:id/activate', adminController.activateProduct);
router.put('/products/:id/deactivate', adminController.deactivateProduct);

module.exports = router;
