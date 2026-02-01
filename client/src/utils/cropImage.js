/**
 * Creates a cropped image from the original image and crop area
 * @param {string} imageSrc - The source image URL
 * @param {Object} pixelCrop - The crop area in pixels
 * @returns {Promise<File>} - The cropped image as a File object
 */
export const createCroppedImage = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to the crop area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            // Create a File object from the blob
            const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });
            resolve(file);
        }, 'image/jpeg', 0.95);
    });
};

/**
 * Helper function to create an image element from a source
 * @param {string} url - The image URL
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * Gets the pixel crop area from the percentage crop
 * @param {Object} crop - The crop area in percentages
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @returns {Object} - The crop area in pixels
 */
export const getCroppedImg = async (imageSrc, crop, imageWidth, imageHeight) => {
    const pixelCrop = {
        x: (crop.x / 100) * imageWidth,
        y: (crop.y / 100) * imageHeight,
        width: (crop.width / 100) * imageWidth,
        height: (crop.height / 100) * imageHeight,
    };

    return createCroppedImage(imageSrc, pixelCrop);
};
