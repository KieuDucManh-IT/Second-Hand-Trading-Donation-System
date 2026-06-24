const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload ảnh hoặc video làm bằng chứng"), false);
  }
};

const uploadComplaintEvidence = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = uploadComplaintEvidence;