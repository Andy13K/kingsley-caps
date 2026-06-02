const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const uploadsBase = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'uploads');

const uploadDir = path.join(uploadsBase, 'tracking');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const extensionByType = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = extensionByType[file.mimetype] || '.jpg';
    cb(null, `tracking-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const uploadTrackingImage = multer({
  storage,
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new AppError('Solo se permiten imágenes JPG, PNG, WEBP o GIF', 400));
      return;
    }
    cb(null, true);
  },
});

module.exports = uploadTrackingImage;
