'use client';

import { useState, useCallback, useRef } from 'react';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  progressive?: boolean;
}

interface OptimizedImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export function useImageOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const optimizeImage = useCallback(async (
    imageFile: File | string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage | null> => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg',
      progressive = true
    } = options;

    setIsOptimizing(true);

    try {
      // Create image element
      const img = new Image();
      const originalSize = typeof imageFile === 'string' ? 0 : imageFile.size;

      // Load image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        
        if (typeof imageFile === 'string') {
          img.src = imageFile;
        } else {
          img.src = URL.createObjectURL(imageFile);
        }
      });

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      // Create or reuse canvas
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Configure context for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, `image/${format}`, quality);
      });

      // Create data URL
      const dataUrl = canvas.toDataURL(`image/${format}`, quality);

      // Clean up object URL if it was created
      if (typeof imageFile !== 'string') {
        URL.revokeObjectURL(img.src);
      }

      const compressedSize = blob.size;
      const compressionRatio = originalSize > 0 ? (originalSize - compressedSize) / originalSize : 0;

      return {
        dataUrl,
        blob,
        width,
        height,
        originalSize,
        compressedSize,
        compressionRatio
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const createThumbnail = useCallback(async (
    imageFile: File | string,
    size: number = 150
  ): Promise<string | null> => {
    const optimized = await optimizeImage(imageFile, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg'
    });

    return optimized?.dataUrl || null;
  }, [optimizeImage]);

  return {
    optimizeImage,
    createThumbnail,
    isOptimizing
  };
}

// Progressive image loading hook
export function useProgressiveImage() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const createProgressiveLoader = useCallback((
    thumbnailSrc: string,
    fullSrc: string,
    onLoad?: (src: string) => void,
    onError?: (src: string) => void
  ) => {
    // Initialize intersection observer if not already created
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const fullSrc = img.dataset.fullSrc;
              
              if (fullSrc && !loadedImages.has(fullSrc) && !failedImages.has(fullSrc)) {
                loadFullImage(fullSrc, img, onLoad, onError);
              }
            }
          });
        },
        { 
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }

    const loadFullImage = (
      fullSrc: string,
      imgElement: HTMLImageElement,
      onLoad?: (src: string) => void,
      onError?: (src: string) => void
    ) => {
      const fullImage = new Image();
      
      fullImage.onload = () => {
        setLoadedImages(prev => new Set([...prev, fullSrc]));
        imgElement.src = fullSrc;
        imgElement.classList.remove('progressive-loading');
        imgElement.classList.add('progressive-loaded');
        
        if (onLoad) onLoad(fullSrc);
      };
      
      fullImage.onerror = () => {
        setFailedImages(prev => new Set([...prev, fullSrc]));
        if (onError) onError(fullSrc);
      };
      
      fullImage.src = fullSrc;
    };

    return {
      ref: (img: HTMLImageElement | null) => {
        if (img && observerRef.current) {
          img.src = thumbnailSrc;
          img.dataset.fullSrc = fullSrc;
          img.classList.add('progressive-loading');
          observerRef.current.observe(img);
        }
      },
      isLoaded: loadedImages.has(fullSrc),
      hasFailed: failedImages.has(fullSrc)
    };
  }, [loadedImages, failedImages]);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  return {
    createProgressiveLoader,
    cleanup,
    loadedCount: loadedImages.size,
    failedCount: failedImages.size
  };
}

// Hook for lazy loading images with blur effect
export function useLazyImage(
  src: string,
  placeholder?: string,
  options: {
    blurAmount?: number;
    transitionDuration?: number;
    rootMargin?: string;
  } = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const {
    blurAmount = 10,
    transitionDuration = 0.3,
    rootMargin = '50px'
  } = options;

  // Set up intersection observer
  const setRef = useCallback((img: HTMLImageElement | null) => {
    if (imgRef.current) {
      // Cleanup previous observer
    }

    imgRef.current = img;

    if (img) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin }
      );

      observer.observe(img);
    }
  }, [rootMargin]);

  // Load image when in view
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const imageProps = {
    ref: setRef,
    src: isInView ? src : placeholder || '',
    onLoad: handleLoad,
    onError: handleError,
    style: {
      filter: isLoaded ? 'blur(0px)' : `blur(${blurAmount}px)`,
      transition: `filter ${transitionDuration}s ease-out`,
    }
  };

  return {
    imageProps,
    isLoaded,
    isInView,
    hasError
  };
}

// Utility function to generate blur placeholder
export function generateBlurPlaceholder(width: number, height: number, color: string = '#e5e5e5'): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL('image/png');
}