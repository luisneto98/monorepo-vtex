import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pressMaterialsService } from '@/services/press-materials.service';
import { useToast } from '@/hooks/useToast';
import type { CreatePressMaterialDto, PressMaterialType } from '@shared/types/press-materials';
import DOMPurify from 'dompurify';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function useFileUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);

  // Enhanced file validation with content checking
  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    // Check file size (max 500MB)
    if (file.size > 524288000) {
      return { isValid: false, error: 'Arquivo muito grande (máximo 500MB)' };
    }

    // Sanitize filename
    const sanitizedName = DOMPurify.sanitize(file.name, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    if (sanitizedName !== file.name) {
      return { isValid: false, error: 'Nome do arquivo contém caracteres inválidos' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Allowed MIME types and extensions
    const allowedTypes = {
      images: {
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        extensions: ['jpg', 'jpeg', 'png', 'webp'],
      },
      videos: {
        mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
        extensions: ['mp4', 'mov', 'webm'],
      },
      documents: {
        mimeTypes: ['application/pdf'],
        extensions: ['pdf'],
      },
      archives: {
        mimeTypes: ['application/zip', 'application/x-zip-compressed'],
        extensions: ['zip'],
      },
      presentations: {
        mimeTypes: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        extensions: ['ppt', 'pptx'],
      },
    };

    // Check if file type is allowed
    const isAllowedType = Object.values(allowedTypes).some(
      (type) => type.mimeTypes.includes(mimeType) && type.extensions.includes(extension || ''),
    );

    if (!isAllowedType) {
      return { isValid: false, error: 'Tipo de arquivo não permitido' };
    }

    // Additional content validation for known file types
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 12));

      // Check file signatures (magic numbers)
      if (mimeType.startsWith('image/')) {
        const signature = Array.from(uint8Array.slice(0, 4))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const imageSignatures = {
          ffd8ffe0: 'jpeg',
          ffd8ffe1: 'jpeg',
          ffd8ffe2: 'jpeg',
          '89504e47': 'png',
          '52494646': 'webp',
        };

        if (!Object.keys(imageSignatures).some((sig) => signature.startsWith(sig))) {
          return { isValid: false, error: 'Arquivo de imagem corrompido ou inválido' };
        }
      } else if (mimeType === 'application/pdf') {
        const pdfSignature = String.fromCharCode(...uint8Array.slice(0, 4));
        if (pdfSignature !== '%PDF') {
          return { isValid: false, error: 'Arquivo PDF corrompido ou inválido' };
        }
      }
    } catch (error) {
      return { isValid: false, error: 'Erro ao validar conteúdo do arquivo' };
    }

    return { isValid: true };
  }, []);

  const detectMaterialType = (file: File): PressMaterialType => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return 'photo';
    }
    if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(extension || '')) {
      return 'video';
    }
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'press_kit';
    }
    if (mimeType === 'application/zip' || extension === 'zip') {
      return 'logo_package';
    }
    if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension || '')) {
      return 'presentation';
    }
    return 'press_kit';
  };

  const uploadSingleFile = useCallback(
    async (uploadFile: UploadFile) => {
      const { id, file } = uploadFile;

      // Validate file before uploading
      const validation = await validateFile(file);
      if (!validation.isValid) {
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: validation.error || 'Arquivo inválido',
                }
              : f,
          ),
        );
        throw new Error(validation.error || 'Arquivo inválido');
      }

      // Update status to uploading
      setUploadQueue((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'uploading' as const } : f)),
      );

      try {
        const materialData: CreatePressMaterialDto = {
          type: detectMaterialType(file),
          title: {
            pt: file.name.replace(/\.[^/.]+$/, ''),
            en: file.name.replace(/\.[^/.]+$/, ''),
            es: file.name.replace(/\.[^/.]+$/, ''),
          },
          status: 'draft',
          accessLevel: 'public',
        };

        await pressMaterialsService.uploadWithProgress(file, materialData, (progress) => {
          setUploadQueue((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
        });

        // Update status to completed
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: 'completed' as const, progress: 100 } : f,
          ),
        );

        return true;
      } catch (error) {
        // Update status to error
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f,
          ),
        );

        throw error;
      }
    },
    [validateFile],
  );

  const uploadMutation = useMutation({
    mutationFn: uploadSingleFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
    },
  });

  const addToQueue = useCallback(
    async (files: File[]) => {
      // Pre-validate files before adding to queue
      const validatedFiles: UploadFile[] = [];

      for (const file of files) {
        const validation = await validateFile(file);
        const uploadFile: UploadFile = {
          id: Math.random().toString(36).substring(7),
          file,
          progress: 0,
          status: validation.isValid ? ('pending' as const) : ('error' as const),
          error: validation.isValid ? undefined : validation.error,
        };
        validatedFiles.push(uploadFile);
      }

      setUploadQueue((prev) => [...prev, ...validatedFiles]);
      return validatedFiles;
    },
    [validateFile],
  );

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  const clearCompleted = useCallback(() => {
    setUploadQueue((prev) => prev.filter((f) => f.status !== 'completed'));
  }, []);

  const retryUpload = useCallback(
    (id: string) => {
      const file = uploadQueue.find((f) => f.id === id);
      if (file && file.status === 'error') {
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: 'pending' as const, progress: 0, error: undefined } : f,
          ),
        );
        uploadMutation.mutate(file);
      }
    },
    [uploadQueue, uploadMutation],
  );

  const processQueue = useCallback(async () => {
    const pendingFiles = uploadQueue.filter((f) => f.status === 'pending');

    if (pendingFiles.length === 0) {
      toast({
        title: 'Info',
        description: 'Nenhum arquivo pendente para enviar',
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const file of pendingFiles) {
      try {
        await uploadSingleFile(file);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to upload ${file.file.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Upload Concluído',
        description: `${successCount} arquivo(s) enviado(s) com sucesso`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: 'Erros no Upload',
        description: `${errorCount} arquivo(s) falharam ao enviar`,
        variant: 'destructive',
      });
    }
  }, [uploadQueue, uploadSingleFile, toast]);

  return {
    uploadQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    clearCompleted,
    retryUpload,
    processQueue,
    isUploading: uploadQueue.some((f) => f.status === 'uploading'),
    hasErrors: uploadQueue.some((f) => f.status === 'error'),
    pendingCount: uploadQueue.filter((f) => f.status === 'pending').length,
    completedCount: uploadQueue.filter((f) => f.status === 'completed').length,
    errorCount: uploadQueue.filter((f) => f.status === 'error').length,
  };
}
