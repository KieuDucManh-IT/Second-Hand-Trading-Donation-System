const { Readable } = require("stream");
const { cloudinary } = require("../config/cloudinary");

function bufferToStream(buffer) {
  return Readable.from([buffer]);
}

function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "exchange-complaints",
        resource_type: options.resourceType || "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    bufferToStream(fileBuffer).pipe(uploadStream);
  });
}

module.exports = uploadToCloudinary;