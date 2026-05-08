const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount } = require('../controllers/notificationController');

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markAsRead);

module.exports = router;
