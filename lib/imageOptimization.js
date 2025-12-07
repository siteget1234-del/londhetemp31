// Helper function to add Cloudinary optimizations to image URLs
export const applyCloudinaryOptimization = (imageUrl) => {
  if (!imageUrl) return imageUrl;
  
  // Check if it's a Cloudinary URL
  if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
    // Add f_auto,q_auto transformations for bandwidth optimization
    return imageUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  
  return imageUrl;
};
