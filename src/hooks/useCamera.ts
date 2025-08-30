'use client';

import { useState, useRef, useCallback } from 'react';

interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
}

interface UseCameraReturn {
  stream: MediaStream | null;
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  startCamera: (constraints?: CameraConstraints) => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  capturePhoto: () => Promise<string | null>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator && 
    'getUserMedia' in navigator.mediaDevices;

  const startCamera = useCallback(async (constraints: CameraConstraints = {}) => {
    if (!isSupported) {
      setError('Camera not supported in this browser');
      return;
    }

    try {
      setError(null);
      
      const mediaConstraints: MediaStreamConstraints = {
        video: {
          width: constraints.width || 1920,
          height: constraints.height || 1080,
          facingMode: constraints.facingMode || facingMode,
          aspectRatio: constraints.aspectRatio || 16/9
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Update facing mode if it was specified
      if (constraints.facingMode) {
        setFacingMode(constraints.facingMode);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setError('No camera found on this device.');
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
        setError('Camera is already in use by another application.');
      } else if (errorMessage.includes('OverconstrainedError') || errorMessage.includes('ConstraintNotSatisfiedError')) {
        setError('Camera constraints could not be satisfied.');
      } else {
        setError(`Camera error: ${errorMessage}`);
      }
      
      setIsActive(false);
    }
  }, [isSupported, facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const switchCamera = useCallback(async () => {
    if (isActive) {
      stopCamera();
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);
      await startCamera({ facingMode: newFacingMode });
    }
  }, [isActive, facingMode, stopCamera, startCamera]);

  const capturePhoto = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !isActive) {
      return null;
    }

    try {
      // Create canvas if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob and return data URL
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (err) {
      setError('Failed to capture photo');
      return null;
    }
  }, [isActive]);

  return {
    stream,
    isSupported,
    isActive,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    videoRef
  };
}

// Helper hook for file upload
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      // Convert to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const selectFile = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const result = await uploadFile(file);
          resolve(result);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }, [uploadFile]);

  return {
    isUploading,
    uploadError,
    uploadFile,
    selectFile
  };
}