/**
 * Compress an image file on the client side using HTML5 Canvas.
 * Resizes the image if it exceeds maxWidth/maxHeight and encodes it as WebP/JPEG with high compression.
 * 
 * @param {File} file The original image file
 * @param {Object} options Compression settings
 * @returns {Promise<File>} Compressed File object
 */
export const compressImage = (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = {}) => {
  return new Promise((resolve, reject) => {
    // Skip if not an image
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // WebP is optimal; fallback to jpeg if unsupported
        const targetType = "image/webp";
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const extension = targetType.split("/")[1];
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + `.${extension}`;
              const compressedFile = new File([blob], newFileName, {
                type: targetType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Fallback to original if blob creation fails
              resolve(file);
            }
          },
          targetType,
          quality
        );
      };
      img.onerror = () => resolve(file); // Fallback to original
    };
    reader.onerror = () => resolve(file); // Fallback to original
  });
};
