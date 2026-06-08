const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Chỉ chấp nhận file ảnh'));
};
 
// ── Upload avatar ngươi dùng ────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'secondhand/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 300, height: 300, crop: 'fill', quality: 'auto' }],
  },
});
 
const uploadAvatar = multer({
  storage:    avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
 
// ── Upload ảnh sản phẩm ──
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'secondhand/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, crop: 'limit', quality: 'auto' }],
  },
});
 
const uploadProduct = multer({
  storage:    productStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
 
// ── Xoá ảnh (dùng chung) ────
const deleteFromCloudinary = (publicId) => cloudinary.uploader.destroy(publicId);
 
module.exports = { uploadAvatar, uploadProduct, deleteFromCloudinary };