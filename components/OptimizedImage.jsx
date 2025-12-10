'use client';

import Image from 'next/image';
import { useState } from 'react';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Apply Cloudinary optimization for Cloudinary URLs
  const optimizeSrc = (imageUrl) => {
    if (!imageUrl) return '/images/placeholder.png';
    
    // Check if it's a Cloudinary URL
    if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
      // Add f_auto,q_auto,w_800 transformations
      return imageUrl.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
    }
    
    return imageUrl;
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-xs">प्रतिमा</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`} />
      )}
      <Image
        src={optimizeSrc(src)}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoadingComplete}
        onError={handleError}
        priority={priority}
        quality={quality}
        sizes={sizes}
        {...props}
      />
    </>
  );
};

export default OptimizedImage;
