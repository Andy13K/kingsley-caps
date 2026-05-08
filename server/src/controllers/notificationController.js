const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

const getMyNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;
  const result = await notificationService.getUserNotifications({
    userId: req.user.id,
    unreadOnly: unreadOnly === 'true',
    page: parseInt(page),
    limit: parseInt(limit),
  });
  res.json({
    success: true,
    data: { notifications: result.notifications, unreadCount: result.unreadCount },
    meta: { total: result.total, page: parseInt(page), limit: parseInt(limit) },
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead({ notificationId: req.params.id, userId: req.user.id });
  res.json({ success: true, data: null });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead({ userId: req.user.id });
  res.json({ success: true, data: null });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount({ userId: req.user.id });
  res.json({ success: true, data: { count } });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount };
