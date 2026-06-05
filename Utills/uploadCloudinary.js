const multer = require("multer");
const cloudinary = require("cloudinary").v2;
<<<<<<< HEAD
const { CloudinaryStorage } = require("multer-storage-cloudinary");
=======
const streamifier = require("streamifier");
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

<<<<<<< HEAD
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
=======
const storage = multer.memoryStorage();

const upload = multer({ storage });

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {

>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1
    let resourceType = "image";

    if (file.mimetype === "application/pdf") {
      resourceType = "raw";
    }

    if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

<<<<<<< HEAD
    return {
      folder: "ehtmam/caregivers",
      resource_type: resourceType,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
=======
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
>>>>>>> 59f9fb5c7893a7e10124107dc3346d771989e0b1
