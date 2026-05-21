const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/orderService');

const create = asyncHandler(async (req, res) => {
  const order = await orderService.create({
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: { order } });
});

const list = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.list({
    user: req.user,
    filters: req.query,
  });
  res.json({ success: true, data: orders, meta });
});

const listMy = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.list({
    user: req.user,
    filters: req.query,
  });
  res.json({ success: true, data: orders, meta });
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.findById({ id: req.params.id, user: req.user });
  res.json({ success: true, data: order });
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus({
    id: req.params.id,
    user: req.user,
    status: req.body.status,
    vendorNotes: req.body.vendorNotes,
  });
  res.json({ success: true, data: order });
});

const setTracking = asyncHandler(async (req, res) => {
  const order = await orderService.setTracking({
    id: req.params.id,
    user: req.user,
    trackingNumber: req.body.trackingNumber,
    trackingCompany: req.body.trackingCompany,
  });
  res.json({ success: true, data: order });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancel({ id: req.params.id, user: req.user });
  res.json({ success: true, data: order });
});

module.exports = { create, list, listMy, getById, updateStatus, setTracking, cancel };
