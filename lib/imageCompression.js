import imageCompression from 'browser-image-compression';

/**
 * Enhanced Two-Step Image Compression System
 * UPGRADED: Crop → WebP Conversion → Enhanced Compression
 * Step 1: Fast compression using browser-image-compression
 * Step 2: Iterative precise compression with WebP (no JPEG fallback)
 */

/**
 * Step 1: Fast Compression
 * Quick initial compression to reduce file size significantly
 */
async function fastCompression(file, targetSizeKB, onProgress) {
  try {
    onProgress?.({ step: 1, message: 'Starting fast WebP compression...' });
    
    const options = {
      maxSizeMB: targetSizeKB / 1024, // Convert KB to MB (e.g., 20KB = 0.0195MB, use 0.04 as buffer)
      useWebWorker: true,
      maxIteration: 10,
      fileType: 'image/webp', // Force WebP format
      onProgress: (progress) => {
        onProgress?.({ step: 1, message: `Fast WebP compression: ${progress}%`, progress });
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
 * Step 2: Enhanced Precise Iterative Compression
 * Uses canvas to compress with WebP format (NO JPEG FALLBACK)
 * Enhanced quality parameters and smoother compression steps
 */
async function preciseCompression(file, targetSizeKB, onProgress) {
  return new Promise((resolve, reject) => {
    onProgress?.({ step: 2, message: 'Starting precise WebP compression...' });
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          let quality = 0.95; // Start with higher quality (was 0.9)
          let scaleFactor = 1.0;
          let iteration = 0;
          const maxIterations = 25; // Increased from 20 for more precision
          let compressedBlob = null;
          
          // Always use WebP - no fallback
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Enable high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          while (iteration < maxIterations) {
            iteration++;
            
            // Calculate scaled dimensions
            const scaledWidth = Math.floor(img.width * scaleFactor);
            const scaledHeight = Math.floor(img.height * scaleFactor);
            
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            
            // Clear and redraw with high quality
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            
            // Convert to WebP blob
            compressedBlob = await new Promise((res) => {
              canvas.toBlob(res, 'image/webp', quality);
            });
            
            const currentSizeKB = compressedBlob.size / 1024;
            
            onProgress?.({
              step: 2,
              message: `Iteration ${iteration}: ${currentSizeKB.toFixed(2)}KB (${(quality * 100).toFixed(0)}% quality, ${(scaleFactor * 100).toFixed(0)}% scale) - WebP`,
              progress: Math.min(95, 50 + (iteration / maxIterations) * 45)
            });
            
            // Check if target size is met
            if (currentSizeKB <= targetSizeKB) {
              onProgress?.({
                step: 2,
                message: `✓ Target achieved: ${currentSizeKB.toFixed(2)}KB (WebP format)`,
                progress: 100
              });
              break;
            }
            
            // Enhanced compression strategy with smaller steps for better quality
            if (quality > 0.7) {
              // Reduce quality in smaller steps when high
              quality -= 0.05; // Smaller step (was 0.1)
            } else if (quality > 0.5) {
              quality -= 0.04; // Even smaller steps in mid-range
            } else if (quality > 0.3) {
              quality -= 0.03;
            } else {
              // If quality is already low, start reducing dimensions gradually
              if (scaleFactor > 0.7) {
                scaleFactor -= 0.05; // Smaller reduction steps
              } else if (scaleFactor > 0.5) {
                scaleFactor -= 0.04;
              } else {
                // Last resort: reduce both more aggressively
                quality = Math.max(0.15, quality - 0.02); // Higher minimum quality (was 0.1)
                scaleFactor = Math.max(0.4, scaleFactor - 0.03); // Higher minimum scale (was 0.3)
              }
            }
            
            // Safety check: if quality and scale are at minimum, break
            if (quality <= 0.15 && scaleFactor <= 0.4) {
              onProgress?.({
                step: 2,
                message: `⚠ Minimum compression reached: ${currentSizeKB.toFixed(2)}KB (WebP - Best quality preserved)`,
                progress: 100
              });
              break;
            }
          }
          
          // Convert blob to file with .webp extension
          const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
          const compressedFile = new File([compressedBlob], fileName, {
            type: 'image/webp',
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
 * Main Enhanced Two-Step Compression Function
 * UPGRADED WORKFLOW: Crop → WebP → Enhanced Compression
 * @param {File} file - Original image file (should be WebP from crop)
 * @param {string} type - 'product' (≤20KB) or 'banner' (≤50KB)
 * @param {Function} onProgress - Progress callback
 * @param {boolean} forceWebP - Force WebP conversion even if file is not WebP
 * @returns {Promise<File>} Compressed WebP image file
 */
export async function compressImageTwoStep(file, type = 'product', onProgress, forceWebP = true) {
  try {
    // Determine target size based on type
    const targetSizeKB = type === 'product' ? 20 : 50;
    
    onProgress?.({
      step: 0,
      message: `Starting WebP compression for ${type}...`,
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
        message: `✓ Fast WebP compression sufficient: ${fastCompressedSizeKB.toFixed(2)}KB`,
        progress: 100,
        finalSize: fastCompressedSizeKB.toFixed(2)
      });
      return fastCompressedFile;
    }
    
    // Step 2: Precise Compression
    onProgress?.({
      step: 1,
      message: `Fast compression: ${fastCompressedSizeKB.toFixed(2)}KB (proceeding to precise WebP compression)`,
      progress: 40
    });
    
    const finalCompressedFile = await preciseCompression(fastCompressedFile, targetSizeKB, onProgress);
    
    const finalSizeKB = finalCompressedFile.size / 1024;
    onProgress?.({
      step: 2,
      message: `✓ WebP compression complete: ${finalSizeKB.toFixed(2)}KB`,
      progress: 100,
      finalSize: finalSizeKB.toFixed(2)
    });
    
    return finalCompressedFile;
  } catch (error) {
    console.error('WebP compression error:', error);
    onProgress?.({
      step: -1,
      message: `Compression failed: ${error.message}`,
      progress: 0,
      error: true
    });
    throw error;
  }
}
