import React, { useState } from 'react';
import { Upload, X, Eye, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: (imageUrl: string) => void;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  uploadedImages?: string[];
  maxImages?: number;
  showPreview?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onImageRemoved,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  uploadedImages = [],
  maxImages = 3,
  showPreview = true,
  className = '',
  theme = 'light'
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const file = files[0];
    if (!file) return;

    // Check if max images reached
    if (uploadedImages.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeInMB}MB`);
      return;
    }

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('https://notelibraryapp.com/upload.php', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Image uploaded successfully!');
        onImageUploaded(result.url);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };
  const removeImage = async (imageUrl: string) => {
    try {
      // Call the delete API to remove the image from the server
      const response = await fetch('https://notelibraryapp.com/delete.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Image deleted successfully');
          onImageRemoved(imageUrl);
        } else {
          toast.error(result.error || 'Failed to delete image from server');
          // Still remove from frontend even if server deletion fails
          onImageRemoved(imageUrl);
        }
      } else {
        toast.error('Failed to delete image from server');
        // Still remove from frontend even if server deletion fails
        onImageRemoved(imageUrl);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error deleting image from server');
      // Still remove from frontend even if server deletion fails
      onImageRemoved(imageUrl);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      {uploadedImages.length < maxImages && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragActive
              ? theme === 'dark' ? 'border-blue-400 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
              : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
          } ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Uploading...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  PNG, JPG, GIF up to {maxSizeInMB}MB ({uploadedImages.length}/{maxImages})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Area */}
      {showPreview && uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {uploadedImages.map((imageUrl, index) => (
            <div
              key={index}
              className={`relative group rounded-lg overflow-hidden border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  onClick={() => window.open(imageUrl, '_blank')}
                  className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  title="View full size"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeImage(imageUrl)}
                  className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact list view for uploaded images (when preview is disabled) */}
      {!showPreview && uploadedImages.length > 0 && (
        <div className="space-y-2">
          {uploadedImages.map((imageUrl, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded border ${
                theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ImageIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image {index + 1}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => window.open(imageUrl, '_blank')}
                  className={`p-1 rounded hover:bg-gray-200 ${theme === 'dark' ? 'hover:bg-gray-600' : ''}`}
                  title="View image"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeImage(imageUrl)}
                  className={`p-1 rounded hover:bg-red-100 text-red-600 ${theme === 'dark' ? 'hover:bg-red-900' : ''}`}
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
