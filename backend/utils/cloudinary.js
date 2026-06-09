const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for equipment images
const equipmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'smart-wager/equipment',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

// Storage for submission files (images + pdf)
const submissionStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    return {
      folder: 'smart-wager/submissions',
      resource_type: isPDF ? 'raw' : 'image',
      allowed_formats: isPDF ? ['pdf'] : ['jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'smart-wager/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const uploadEquipment = multer({ storage: equipmentStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadSubmission = multer({ storage: submissionStorage, limits: { fileSize: 20 * 1024 * 1024 } });
const uploadProfile = multer({ storage: profileStorage, limits: { fileSize: 2 * 1024 * 1024 } });

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = { cloudinary, uploadEquipment, uploadSubmission, uploadProfile, deleteFromCloudinary };
