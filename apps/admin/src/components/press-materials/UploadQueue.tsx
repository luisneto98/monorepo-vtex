import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadQueueProps {
  files: UploadFile[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onClear?: () => void;
}

export function UploadQueue({
  files,
  onRemove,
  onRetry,
  onClear,
}: UploadQueueProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  // const uploadingCount = files.filter(f => f.status === 'uploading').length;

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Progresso do Upload</h3>
            <p className="text-sm text-gray-500 mt-1">
              {completedCount} de {files.length} arquivo(s) enviado(s)
              {errorCount > 0 && `, ${errorCount} erro(s)`}
            </p>
          </div>
          {onClear && files.every(f => f.status === 'completed' || f.status === 'error') && (
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpar Lista
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              "px-4 py-3 border-b border-gray-100 last:border-0",
              file.status === 'error' && "bg-red-50",
              file.status === 'completed' && "bg-green-50"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {file.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full bg-gray-200" />
                )}
                {file.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file.size)}
                </p>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={file.progress} className="h-1" />
                    <p className="text-xs text-gray-500 mt-1">
                      {file.progress}% enviado
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {file.error && (
                  <p className="text-xs text-red-600 mt-1">{file.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                {file.status === 'error' && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetry(file.id)}
                  >
                    Tentar Novamente
                  </Button>
                )}
                {(file.status === 'pending' || file.status === 'error') && onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}