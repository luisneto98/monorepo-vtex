import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
  progress?: number;
  error?: string;
}

interface FileUploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
}

export function FileUploadZone({
  onUpload,
  accept = {
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'video/*': ['.mp4', '.mov', '.webm'],
    'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  },
  maxSize = 524288000, // 500MB
  multiple = true,
}: FileUploadZoneProps) {
  const [uploadQueue, setUploadQueue] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Create preview URLs for images
    const filesWithPreview = acceptedFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.id = Math.random().toString(36).substring(7);

      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      return fileWithPreview;
    });

    setUploadQueue((prev) => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
  });

  const removeFromQueue = (fileId: string) => {
    setUploadQueue((prev) => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadQueue.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [uploadQueue]);

  const startUpload = async () => {
    if (uploadQueue.length === 0) return;

    setIsUploading(true);

    try {
      // Call the actual upload handler
      await onUpload(uploadQueue);

      // Clear the queue after successful upload and cleanup preview URLs
      uploadQueue.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setUploadQueue([]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadQueue((prev) =>
        prev.map((f) => ({ ...f, error: 'Falha no upload' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
          "hover:border-gray-400 hover:bg-gray-50",
          isDragActive && "border-blue-500 bg-blue-50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-700">
            {isDragActive
              ? "Solte os arquivos aqui..."
              : "Arraste arquivos ou clique para selecionar"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, ZIP, Imagens, Vídeos ou Apresentações (até 500MB)
          </p>
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Alguns arquivos foram rejeitados:
              </p>
              <ul className="mt-1 text-sm text-red-600 space-y-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    {file.name} - {errors.map(e => e.message).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Fila de Upload ({uploadQueue.length} arquivo{uploadQueue.length > 1 ? 's' : ''})
            </h3>
            <div className="flex items-center gap-2">
              {!isUploading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Cleanup preview URLs before clearing
                    uploadQueue.forEach(file => {
                      if (file.preview) {
                        URL.revokeObjectURL(file.preview);
                      }
                    });
                    setUploadQueue([]);
                  }}
                >
                  Limpar Fila
                </Button>
              )}
              <Button
                size="sm"
                onClick={startUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Enviando...' : 'Enviar Todos'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {uploadQueue.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-3 p-3 bg-gray-50 rounded-md",
                  file.error && "bg-red-50"
                )}
              >
                {/* File Preview */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Remove Button */}
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromQueue(file.id!)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}