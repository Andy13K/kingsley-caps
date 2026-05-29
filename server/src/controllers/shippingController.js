const asyncHandler = require('../utils/asyncHandler');
const shippingService = require('../services/shippingService');

const addTracking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, trackingCompany } = req.body;
  const shippingProofUrl = req.file ? `/uploads/shipping/${req.file.filename}` : undefined;
  const order = await shippingService.addTracking({
    orderId,
    trackingNumber,
    trackingCompany,
    shippingProofUrl,
    userId: req.user.id,
    userRole: req.user.role,
  });
  res.json({ success: true, data: { order } });
});

const getTrackingInfo = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const tracking = await shippingService.getTrackingInfo({ orderId, userId: req.user.id, userRole: req.user.role });
  res.json({ success: true, data: { tracking } });
});

module.exports = { addTracking, getTrackingInfo };
