const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: "dxhqdscsq",
  api_key: "694215367773383",
  api_secret: "EezbByKWv0DrN_bmX9DdC2ooxdM",
});

const storage = new multer.memoryStorage();

async function imageUploadUtil(file) {
  try {
    
    const uploadOptions = {
      resource_type: "auto",
      folder: "product-images",
      public_id: `${Date.now()}`, 
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}


const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

module.exports = { upload, imageUploadUtil };