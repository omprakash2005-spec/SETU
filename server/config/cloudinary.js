import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cloudinary configuration for image uploads
 * Memory-based storage (collaboration-safe, production-ready)
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer from multer
 * @param {string} folder - Cloudinary folder (default: 'setu/posts')
 * @returns {Promise<string>} - Cloudinary image URL
 */
export const uploadToCloudinary = (fileBuffer, folder = 'setu/posts') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Max size
          { quality: 'auto:good' }, // Auto optimize quality
          { fetch_format: 'auto' }, // Auto format (WebP, etc.)
        ],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Image upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Full Cloudinary image URL
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Extract public_id from URL
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567/setu/posts/abc123.jpg
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts.slice(-2, -1)[0];
    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
    // Don't throw - deletion is best effort
  }
};

/**
 * Upload document (ID card - image or PDF) to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} mimetype - File mimetype
 * @param {string} folder - Cloudinary folder (default: 'setu/student_ids')
 * @returns {Promise<string>} - Cloudinary file URL
 */
export const uploadDocumentToCloudinary = (fileBuffer, mimetype, folder = 'setu/student_ids') => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on mimetype
    const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image';
    
    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };

    // Add transformations only for images, not PDFs
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 2000, height: 2000, crop: 'limit' }, // Max size for ID cards
        { quality: 'auto:good' },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary document upload error:', error);
          reject(new Error('Document upload failed'));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
