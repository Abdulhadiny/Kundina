'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, Download, Maximize2, X } from 'lucide-react';
import { useLazyImage, useImageOptimization, generateBlurPlaceholder } from '@/hooks/useImageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  className?: string;
  placeholder?: string;
  showControls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 0.8,
  className = '',
  placeholder,
  showControls = true,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const { optimizeImage } = useImageOptimization();
  
  // Generate placeholder if not provided
  const defaultPlaceholder = placeholder || 
    (width && height ? generateBlurPlaceholder(width, height) : undefined);

  const {
    imageProps,
    isLoaded,
    isInView,
    hasError
  } = useLazyImage(optimizedSrc || src, defaultPlaceholder, {
    blurAmount: 5,
    transitionDuration: 0.4
  });

  // Optimize image when it comes into view
  useEffect(() => {
    if (isInView && !optimizedSrc && !isOptimizing) {
      optimizeImageSrc();
    }
  }, [isInView, optimizedSrc, isOptimizing]);

  const optimizeImageSrc = async () => {
    if (!src || optimizedSrc) return;
    
    setIsOptimizing(true);
    
    try {
      const optimized = await optimizeImage(src, {
        maxWidth: width || 1920,
        maxHeight: height || 1080,
        quality,
        format: 'webp'
      });

      if (optimized) {
        setOptimizedSrc(optimized.dataUrl);
      }
    } catch (error) {
      console.error('Failed to optimize image:', error);
      if (onError) {
        onError('Failed to optimize image');
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleImageLoad = () => {
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    if (onError) onError('Failed to load image');
  };

  const handleDownload = async () => {
    if (!optimizedSrc && !src) return;

    try {
      const imageUrl = optimizedSrc || src;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded ${className}`}
        style={{ width, height: height || 200 }}
      >
        <div className="text-center text-gray-500">
          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <img
          {...imageProps}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="w-full h-auto rounded-lg"
        />

        {/* Loading Overlay */}
        {(isOptimizing || !isLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-75 rounded-lg">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">
                {isOptimizing ? 'Optimizing...' : 'Loading...'}
              </span>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && isLoaded && (
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleFullscreen}
              className="p-1.5 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
              title="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1.5 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75 transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Optimization Info */}
        {optimizedSrc && (
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">
              WebP Optimized
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={optimizedSrc || src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
            
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-black bg-opacity-50 text-white px-4 py-2 rounded hover:bg-opacity-75 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Gallery component for multiple optimized images
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  thumbnailSize?: number;
}

export function ImageGallery({ 
  images, 
  className = '',
  thumbnailSize = 150
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`grid gap-2 ${className}`}>
        {images.length === 1 ? (
          <OptimizedImage
            src={images[0].src}
            alt={images[0].alt}
            className="w-full"
            onLoad={() => {}}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedIndex(index)}
              >
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  width={thumbnailSize}
                  height={thumbnailSize}
                  quality={0.6}
                  className="aspect-square object-cover"
                  showControls={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images[selectedIndex].src}
              alt={images[selectedIndex].alt}
              className="max-w-full max-h-full object-contain"
            />

            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                >
                  ←
                </button>
                
                <button
                  onClick={() => setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                >
                  →
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                  {selectedIndex + 1} of {images.length}
                </div>
              </>
            )}

            {/* Caption */}
            {images[selectedIndex].caption && (
              <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-50 p-2 rounded">
                {images[selectedIndex].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}