import imageCompression from 'browser-image-compression';

/**
 * Two-Step Image Compression System
 * Step 1: Fast compression using browser-image-compression
 * Step 2: Iterative precise compression with WebP → JPEG fallback
 */

/**
 * Step 1: Fast Compression
 * Quick initial compression to reduce file size significantly
 */
async function fastCompression(file, targetSizeKB, onProgress) {
  try {
    onProgress?.({ step: 1, message: 'Starting fast compression...' });
    
    const options = {
      maxSizeMB: targetSizeKB / 1024, // Convert KB to MB (e.g., 20KB = 0.0195MB, use 0.04 as buffer)
      useWebWorker: true,
      maxIteration: 10,
      onProgress: (progress) => {
        onProgress?.({ step: 1, message: `Fast compression: ${progress}%`, progress });
      }
    };

    const compressedFile = await imageCompression(file, options);
    
    onProgress?.({ step: 1, message: `Fast compression complete: ${(compressedFile.size / 1024).toFixed(2)}KB` });
    
    return compressedFile;
  } catch (error) {
    console.error('Fast compression failed:', error);
    throw error;
  }
}

/**
 * Step 2: Precise Iterative Compression
 * Uses canvas to compress with WebP (fallback to JPEG) until target size is met
 */
async function preciseCompression(file, targetSizeKB, onProgress) {
  return new Promise((resolve, reject) => {
    onProgress?.({ step: 2, message: 'Starting precise compression...' });
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          let quality = 0.9;
          let scaleFactor = 1.0;
          let iteration = 0;
          const maxIterations = 20;
          let compressedBlob = null;
          let useWebP = true;
          
          // Try WebP first
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          while (iteration < maxIterations) {
            iteration++;
            
            // Calculate scaled dimensions
            const scaledWidth = Math.floor(img.width * scaleFactor);
            const scaledHeight = Math.floor(img.height * scaleFactor);
            
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            
            // Draw image on canvas with scaled dimensions
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            
            // Convert to blob
            const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
            compressedBlob = await new Promise((res) => {
              canvas.toBlob(res, mimeType, quality);
            });
            
            const currentSizeKB = compressedBlob.size / 1024;
            
            onProgress?.({
              step: 2,
              message: `Iteration ${iteration}: ${currentSizeKB.toFixed(2)}KB (${(quality * 100).toFixed(0)}% quality, ${(scaleFactor * 100).toFixed(0)}% scale)`,
              progress: Math.min(95, 50 + (iteration / maxIterations) * 45)
            });
            
            // Check if target size is met
            if (currentSizeKB <= targetSizeKB) {
              onProgress?.({
                step: 2,
                message: `✓ Target achieved: ${currentSizeKB.toFixed(2)}KB (${useWebP ? 'WebP' : 'JPEG'})`,
                progress: 100
              });
              break;
            }
            
            // If WebP didn't work well and still large, try JPEG
            if (useWebP && iteration > 5 && currentSizeKB > targetSizeKB * 2) {
              useWebP = false;
              quality = 0.9;
              scaleFactor = 1.0;
              iteration = 0;
              onProgress?.({
                step: 2,
                message: 'Switching to JPEG format...',
                progress: 30
              });
              continue;
            }
            
            // Reduce quality more aggressively first
            if (quality > 0.5) {
              quality -= 0.1;
            } else if (quality > 0.3) {
              quality -= 0.05;
            } else {
              // If quality is already low, start reducing dimensions
              if (scaleFactor > 0.5) {
                scaleFactor -= 0.1;
              } else {
                // Last resort: reduce both aggressively
                quality = Math.max(0.1, quality - 0.05);
                scaleFactor = Math.max(0.3, scaleFactor - 0.05);
              }
            }
            
            // Safety check: if quality and scale are at minimum, break
            if (quality <= 0.1 && scaleFactor <= 0.3) {
              onProgress?.({
                step: 2,
                message: `⚠ Minimum compression reached: ${currentSizeKB.toFixed(2)}KB`,
                progress: 100
              });
              break;
            }
          }
          
          // Convert blob to file
          const extension = useWebP ? 'webp' : 'jpg';
          const fileName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
          const compressedFile = new File([compressedBlob], fileName, {
            type: compressedBlob.type,
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Main Two-Step Compression Function
 * @param {File} file - Original image file
 * @param {string} type - 'product' (≤20KB) or 'banner' (≤50KB)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImageTwoStep(file, type = 'product', onProgress) {
  try {
    // Determine target size based on type
    const targetSizeKB = type === 'product' ? 20 : 50;
    
    onProgress?.({
      step: 0,
      message: `Starting compression for ${type}...`,
      progress: 0,
      originalSize: (file.size / 1024).toFixed(2)
    });
    
    // Step 1: Fast Compression
    const fastCompressedFile = await fastCompression(file, targetSizeKB, onProgress);
    
    const fastCompressedSizeKB = fastCompressedFile.size / 1024;
    
    // If fast compression already meets target, return it
    if (fastCompressedSizeKB <= targetSizeKB) {
      onProgress?.({
        step: 2,
        message: `✓ Fast compression sufficient: ${fastCompressedSizeKB.toFixed(2)}KB`,
        progress: 100,
        finalSize: fastCompressedSizeKB.toFixed(2)
      });
      return fastCompressedFile;
    }
    
    // Step 2: Precise Compression
    onProgress?.({
      step: 1,
      message: `Fast compression: ${fastCompressedSizeKB.toFixed(2)}KB (proceeding to precise compression)`,
      progress: 40
    });
    
    const finalCompressedFile = await preciseCompression(fastCompressedFile, targetSizeKB, onProgress);
    
    const finalSizeKB = finalCompressedFile.size / 1024;
    onProgress?.({
      step: 2,
      message: `✓ Compression complete: ${finalSizeKB.toFixed(2)}KB`,
      progress: 100,
      finalSize: finalSizeKB.toFixed(2)
    });
    
    return finalCompressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    onProgress?.({
      step: -1,
      message: `Compression failed: ${error.message}`,
      progress: 0,
      error: true
    });
    throw error;
  }
}
