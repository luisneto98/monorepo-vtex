import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string) => void;
  loading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];

export function LogoUpload({ currentLogoUrl, onLogoChange, loading = false }: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'Unsupported file format. Please use JPG, PNG, SVG, or WEBP.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size too large. Please use files smaller than 5MB.';
    }

    return null;
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = img;

        // Calculate new dimensions
        let newWidth = width;
        let newHeight = height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            newWidth = maxWidth;
            newHeight = maxWidth / aspectRatio;
          } else {
            newHeight = maxHeight;
            newWidth = maxHeight * aspectRatio;
          }
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/jpeg', 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Simulate file upload - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock successful upload
        const mockUrl = URL.createObjectURL(file);
        resolve(mockUrl);
      }, 2000);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Resize image if needed (except SVG)
      let processedFile = file;
      if (file.type !== 'image/svg+xml') {
        const resizedBlob = await resizeImage(file, 500, 500);
        processedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      }

      // Upload file
      const logoUrl = await uploadFile(processedFile);
      onLogoChange(logoUrl);

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
      setPreview(currentLogoUrl || null);
    } finally {
      setUploading(false);
    }
  }, [currentLogoUrl, onLogoChange]);

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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = () => {
    setPreview(null);
    setError(null);
    onLogoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label>Logo</Label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-destructive bg-destructive/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${loading || uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FORMATS.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={loading || uploading}
        />

        {preview ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Logo preview"
                className="max-w-48 max-h-32 object-contain border rounded"
              />
              {!uploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm"
                  onClick={removeLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {uploading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Uploading...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Logo uploaded successfully
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={uploading}
            >
              Replace Logo
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="p-4 rounded-full bg-muted">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {uploading ? 'Uploading logo...' : 'Drop logo here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, SVG, WEBP up to 5MB
              </p>
            </div>

            <Button
              variant="outline"
              onClick={openFileDialog}
              disabled={uploading}
            >
              <FileImage className="h-4 w-4 mr-2" />
              Select Logo
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Recommended dimensions: 500x500 pixels or smaller</p>
        <p>• Images will be automatically resized and optimized</p>
        <p>• SVG files are supported for vector logos</p>
      </div>
    </div>
  );
}