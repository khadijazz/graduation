const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({ storage });

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {

    let resourceType = "image";

    if (file.mimetype === "application/pdf") {
      resourceType = "raw";
    }

    if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: "ehtmam/uploads",
          resource_type: resourceType,
        },
        (error, result) => {

          if (error) {
            return reject(error);
          }

          resolve(result.secure_url);
        }
      );

    streamifier
      .createReadStream(file.buffer)
      .pipe(uploadStream);

  });
};

module.exports = {
  upload,
  uploadToCloudinary,
};