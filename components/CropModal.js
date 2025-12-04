import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';

/**
 * CropModal Component
 * Allows users to crop images to specific aspect ratios before upload
 * Enhanced: Exports as WebP format for better compression
 * 
 * @param {File} file - The image file to crop
 * @param {number} aspectRatio - Aspect ratio (e.g., 4/3, 16/9)
 * @param {string} title - Modal title
 * @param {function} onCropComplete - Callback with cropped image blob
 * @param {function} onCancel - Callback when user cancels
 */
export default function CropModal({ file, aspectRatio, title, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Load image from file
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  }, [file]);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      setProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, file.name);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">Crop your image to the correct screen size • WebP format for best quality</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={processing}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative flex-1 bg-gray-900" style={{ minHeight: '400px' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaComplete}
              objectFit="contain"
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          {/* Zoom Slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              disabled={processing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={createCroppedImage}
              disabled={processing}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Crop & Convert to WebP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to create cropped image
 * Enhanced: Exports as WebP format with high quality (0.98)
 */
async function getCroppedImg(imageSrc, pixelCrop, fileName) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

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

  return new Promise((resolve, reject) => {
    // Export as WebP with high quality (0.98)
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/webp', 0.98);
  });
}

/**
 * Helper function to create image element from src
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}
