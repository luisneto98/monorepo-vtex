import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SponsorsService } from '@/services/sponsors.service';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string) => void;
  loading?: boolean;
  sponsorId?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function LogoUpload({ currentLogoUrl, onLogoChange, loading = false, sponsorId }: LogoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'Unsupported file format. Please use JPG, PNG, or WEBP.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size too large. Please use files smaller than 5MB.';
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!sponsorId) {
      throw new Error('Sponsor ID is required for upload. Please save the sponsor first.');
    }

    const response = await SponsorsService.uploadLogo(sponsorId, file);
    return response.data.data.logoUrl;
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

      // Upload file
      const logoUrl = await uploadFile(file);
      onLogoChange(logoUrl);
      setPreview(logoUrl);

    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMessage);
      setPreview(currentLogoUrl || null);
    } finally {
      setUploading(false);
    }
  }, [currentLogoUrl, onLogoChange, sponsorId]);

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
                Supports JPG, PNG, WEBP up to 5MB
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
        <p>• Images will be automatically validated and optimized</p>
        {!sponsorId && (
          <p className="text-yellow-600">⚠️ Save the sponsor before uploading a logo</p>
        )}
      </div>
    </div>
  );
}