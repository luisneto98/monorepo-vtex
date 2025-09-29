import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onUpload,
  accept = 'application/pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === 'file-too-large') {
          toast({
            title: 'File too large',
            description: `File must be smaller than ${maxSize / (1024 * 1024)}MB`,
            variant: 'destructive',
          });
        } else if (error.code === 'file-invalid-type') {
          toast({
            title: 'Invalid file type',
            description: 'Only PDF files are allowed',
            variant: 'destructive',
          });
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    [maxSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept === 'application/pdf' ? {
      'application/pdf': ['.pdf'],
    } : undefined,
    maxSize,
    multiple: false,
  });

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <Card
          {...getRootProps()}
          className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop the PDF here' : 'Drag & drop PDF here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to select a file
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PDF files only, max {maxSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpload} className="w-full">
              Upload File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};