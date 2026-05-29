const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const uploadDir = path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'uploads', 'proofs');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const extensionByType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50) || 'comprobante';
    const ext = extensionByType[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${safeName}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const uploadPaymentProof = multer({
  storage,
  limits: { files: 1, fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new AppError('Solo se permiten comprobantes JPG, PNG, WEBP o PDF', 400));
      return;
    }
    cb(null, true);
  },
});

module.exports = uploadPaymentProof;
