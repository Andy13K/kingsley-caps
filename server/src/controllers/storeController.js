const asyncHandler = require('../utils/asyncHandler');
const storeService = require('../services/storeService');

const create = asyncHandler(async (req, res) => {
  const store = await storeService.create({
    vendorId: req.user.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: store });
});

const getMine = asyncHandler(async (req, res) => {
  const store = await storeService.findMine(req.user.id, req.user.role);
  res.json({ success: true, data: store });
});

const getPublicBySlug = asyncHandler(async (req, res) => {
  const store = await storeService.findPublicBySlug(req.params.slug);
  res.json({ success: true, data: { store } });
});

const update = asyncHandler(async (req, res) => {
  const store = await storeService.update({
    id: req.params.id,
    vendorId: req.user.id,
    payload: req.body,
  });
  res.json({ success: true, data: store });
});

const updateMine = asyncHandler(async (req, res) => {
  const mine = await storeService.findMine(req.user.id, req.user.role);
  const store = await storeService.update({
    id: mine.id,
    vendorId: req.user.id,
    userRole: req.user.role,
    payload: req.body,
  });
  res.json({ success: true, data: store });
});

const updateCryptoConfig = asyncHandler(async (req, res) => {
  const store = await storeService.updateCryptoConfig({
    id: req.params.id,
    vendorId: req.user.id,
    payload: req.body,
  });
  res.json({ success: true, data: store });
});

const publish = asyncHandler(async (req, res) => {
  const store = await storeService.publish({
    id: req.params.id,
    vendorId: req.user.id,
  });
  res.json({ success: true, data: store });
});

module.exports = { create, getMine, getPublicBySlug, update, updateMine, updateCryptoConfig, publish };
