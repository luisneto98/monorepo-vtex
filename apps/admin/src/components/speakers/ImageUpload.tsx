import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { speakersService } from '@/services/speakers.service';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  speakerId?: string; // ID do speaker (opcional para novo speaker)
}

export function ImageUpload({ value, onChange, disabled = false, speakerId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(value);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!acceptedFormats.includes(file.type)) {
      setError('Invalid file format. Please upload JPG, PNG, or WebP images.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 5MB.');
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    // Verificar se temos speakerId para fazer upload
    if (!speakerId) {
      setError('Cannot upload photo: Speaker must be created first. Please save the speaker and then upload the photo.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server with speakerId
      const response = await speakersService.uploadPhoto(speakerId, file);
      onChange(response.photoUrl);
      setPreview(response.photoUrl);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to upload image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInput = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      try {
        new URL(url); // Validate URL
        setPreview(url);
        onChange(url);
        setError(null);
      } catch {
        setError('Invalid URL format');
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label>Speaker Photo</Label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Speaker preview"
            className="w-32 h-32 object-cover rounded-lg"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {uploading ? 'Uploading...' : 'Drag and drop an image here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP. Max 5MB. Recommended: 400x400px
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUrlInput}
          disabled={disabled || uploading}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Use URL
        </Button>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Uploading image...
        </div>
      )}
    </div>
  );
}