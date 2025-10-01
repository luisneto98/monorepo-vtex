import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
  });

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
          "hover:border-gray-400 hover:bg-gray-50",
          isDragActive && "border-blue-500 bg-blue-50"
        )}
      >
        <input {...getInputProps()} />
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
    </div>
  );
}