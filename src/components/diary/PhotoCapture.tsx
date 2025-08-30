'use client';

import { useState } from 'react';
import { Camera, Upload, RotateCcw, X, Check, Image as ImageIcon } from 'lucide-react';
import { useCamera, useFileUpload } from '@/hooks/useCamera';

interface PhotoCaptureProps {
  onPhotoCapture: (photoUrl: string) => void;
  onClose: () => void;
  className?: string;
}

export default function PhotoCapture({ onPhotoCapture, onClose, className = '' }: PhotoCaptureProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  
  const {
    isSupported,
    isActive,
    error: cameraError,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    videoRef
  } = useCamera();

  const {
    isUploading,
    uploadError,
    selectFile
  } = useFileUpload();

  const handleStartCamera = async () => {
    await startCamera({
      width: 1280,
      height: 720,
      facingMode: 'environment'
    });
  };

  const handleCapturePhoto = async () => {
    const photo = await capturePhoto();
    if (photo) {
      setCapturedPhoto(photo);
      stopCamera();
    }
  };

  const handleUploadPhoto = async () => {
    const photo = await selectFile();
    if (photo) {
      setCapturedPhoto(photo);
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      onClose();
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    if (mode === 'camera') {
      handleStartCamera();
    }
  };

  const error = cameraError || uploadError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Add Photo</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selection */}
        {!capturedPhoto && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setMode('camera')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded ${
                  mode === 'camera'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded ${
                  mode === 'upload'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="relative bg-gray-900" style={{ aspectRatio: '16/9' }}>
          {/* Camera Mode */}
          {mode === 'camera' && !capturedPhoto && (
            <>
              {!isSupported ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Camera Not Available</p>
                    <p className="text-sm opacity-75 mt-2">
                      Camera access is not supported in this browser
                    </p>
                  </div>
                </div>
              ) : !isActive ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-4" />
                    <button
                      onClick={handleStartCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Start Camera
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              )}
            </>
          )}

          {/* Upload Mode */}
          {mode === 'upload' && !capturedPhoto && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                <button
                  onClick={handleUploadPhoto}
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Select Photo'}
                </button>
              </div>
            </div>
          )}

          {/* Captured Photo Preview */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Camera Controls */}
          {mode === 'camera' && isActive && !capturedPhoto && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <button
                onClick={switchCamera}
                className="w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-800 transition-colors shadow-lg"
              >
                <div className="w-12 h-12 border-4 border-gray-800 rounded-full"></div>
              </button>
              
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Photo Confirmation Controls */}
          {capturedPhoto && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <button
                onClick={handleRetakePhoto}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              
              <button
                onClick={handleConfirmPhoto}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Use Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('denied') && (
              <div className="mt-2 text-xs text-red-600">
                <strong>To enable camera:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>Click the camera icon in your address bar</li>
                  <li>Select &quot;Allow&quot; for camera permissions</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!error && !capturedPhoto && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <strong>Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Make sure you have good lighting for the best quality</li>
                <li>• Hold your device steady when taking photos</li>
                <li>• Photos are stored locally in your device</li>
                <li>• Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact photo picker button for toolbar integration
export function PhotoPickerButton({
  onPhotoSelect,
  className = ''
}: {
  onPhotoSelect: (photoUrl: string) => void;
  className?: string;
}) {
  const [showCapture, setShowCapture] = useState(false);

  const handlePhotoCapture = (photoUrl: string) => {
    onPhotoSelect(photoUrl);
    setShowCapture(false);
  };

  return (
    <>
      <button
        onClick={() => setShowCapture(true)}
        className={`p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors ${className}`}
        title="Add photo"
      >
        <Camera className="w-4 h-4" />
      </button>

      {showCapture && (
        <PhotoCapture
          onPhotoCapture={handlePhotoCapture}
          onClose={() => setShowCapture(false)}
        />
      )}
    </>
  );
}