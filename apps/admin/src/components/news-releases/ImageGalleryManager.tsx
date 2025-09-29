import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import newsReleasesService from '../../services/news-releases.service';
import type { ImageGalleryItem } from '@shared/types/news-releases';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableImage } from './SortableImage';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ImageGalleryManagerProps {
  releaseId: string;
  images: ImageGalleryItem[];
}

export function ImageGalleryManager({ releaseId, images }: ImageGalleryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageGalleryItem | null>(null);
  const [imageList, setImageList] = useState(images);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [individualProgress, setIndividualProgress] = useState<Record<string, number>>({});
  const previewUrlsRef = useRef<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      metadata,
    }: {
      file: File;
      metadata?: any;
    }) => {
      return newsReleasesService.uploadImage(releaseId, file, metadata);
    },
    onSuccess: (data) => {
      setImageList(data.images || []);
      queryClient.invalidateQueries({ queryKey: ['newsRelease', releaseId] });
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload image',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      newsReleasesService.removeImage(releaseId, imageId),
    onSuccess: (data) => {
      setImageList(data.images || []);
      queryClient.invalidateQueries({ queryKey: ['newsRelease', releaseId] });
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete image',
        variant: 'destructive',
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (imageIds: string[]) =>
      newsReleasesService.reorderImages(releaseId, imageIds),
    onSuccess: (data) => {
      setImageList(data.images || []);
      queryClient.invalidateQueries({ queryKey: ['newsRelease', releaseId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reorder images',
        variant: 'destructive',
      });
    },
  });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setPendingFiles(acceptedFiles);
      setIsUploading(true);
      setUploadProgress(0);
      setIndividualProgress({});

      const totalFiles = acceptedFiles.length;

      // Create preview URLs and track them for cleanup
      const newPreviewUrls = acceptedFiles.map(file => {
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.push(url);
        return url;
      });

      // Parallel upload with progress tracking
      const uploadPromises = acceptedFiles.map((file, index) => {
        const fileId = `${file.name}-${index}`;

        return uploadMutation.mutateAsync({
          file,
          metadata: {
            order: imageList.length + index,
            previewUrl: newPreviewUrls[index]
          },
        }).then(result => {
          // Update individual file progress
          setIndividualProgress(prev => ({
            ...prev,
            [fileId]: 100
          }));

          // Update overall progress
          const completed = Object.values({
            ...individualProgress,
            [fileId]: 100
          }).filter(p => p === 100).length;

          setUploadProgress(Math.round((completed / totalFiles) * 100));

          // Cleanup preview URL after successful upload
          const urlIndex = previewUrlsRef.current.indexOf(newPreviewUrls[index]);
          if (urlIndex > -1) {
            URL.revokeObjectURL(newPreviewUrls[index]);
            previewUrlsRef.current.splice(urlIndex, 1);
          }

          return result;
        }).catch(error => {
          // Handle individual file upload failure
          toast({
            title: 'Upload Failed',
            description: `Failed to upload ${file.name}: ${error.message}`,
            variant: 'destructive',
          });

          // Cleanup preview URL on failure
          const urlIndex = previewUrlsRef.current.indexOf(newPreviewUrls[index]);
          if (urlIndex > -1) {
            URL.revokeObjectURL(newPreviewUrls[index]);
            previewUrlsRef.current.splice(urlIndex, 1);
          }

          throw error;
        });
      });

      try {
        // Wait for all uploads to complete
        const results = await Promise.allSettled(uploadPromises);

        // Count successful uploads
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        if (successCount > 0) {
          toast({
            title: 'Upload Complete',
            description: `Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
          });

          // Refresh the image list
          queryClient.invalidateQueries({ queryKey: ['newsRelease', releaseId] });
        }
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
        setPendingFiles([]);
        setUploadProgress(0);
        setIndividualProgress({});
      }
    },
    [imageList.length, uploadMutation, individualProgress, queryClient, releaseId, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10485760,
    disabled: isUploading,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = imageList.findIndex((img) => img._id === active.id);
      const newIndex = imageList.findIndex((img) => img._id === over?.id);

      const newOrder = arrayMove(imageList, oldIndex, newIndex);
      setImageList(newOrder);

      const imageIds = newOrder.map((img) => img._id!).filter(Boolean);
      reorderMutation.mutate(imageIds);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    deleteMutation.mutate(imageId);
  };

  const handleEditImage = (image: ImageGalleryItem) => {
    setEditingImage(image);
  };

  const handleSaveImageEdit = async () => {
    if (!editingImage) return;

    const updatedImages = imageList.map((img) =>
      img._id === editingImage._id ? editingImage : img
    );

    await newsReleasesService.updateNewsRelease(releaseId, {
      images: updatedImages,
    });

    queryClient.invalidateQueries({ queryKey: ['newsRelease', releaseId] });
    setEditingImage(null);
    toast({
      title: 'Success',
      description: 'Image details updated',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Image Gallery</Label>
        <span className="text-sm text-muted-foreground">
          {imageList.length} / 20 images
        </span>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-primary bg-muted/50' : 'border-muted-foreground/25'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <div>
            <p>Drag and drop images here, or click to select</p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG, JPG, GIF, WebP up to 10MB
            </p>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} in parallel...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
          {pendingFiles.length > 1 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {pendingFiles.map((file, index) => {
                const fileId = `${file.name}-${index}`;
                const fileProgress = individualProgress[fileId] || 0;
                return (
                  <div key={fileId} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span>{fileProgress === 100 ? '✓' : 'Uploading...'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {imageList.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={imageList.map((img) => img._id!)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageList.map((image) => (
                <SortableImage
                  key={image._id}
                  image={image}
                  onDelete={handleDeleteImage}
                  onEdit={handleEditImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingImage && (
        <Dialog open onOpenChange={() => setEditingImage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Image Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <img
                src={editingImage.url}
                alt=""
                className="w-full h-48 object-cover rounded"
              />

              <Tabs defaultValue="pt-BR">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="pt-BR">Português</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="es">Español</TabsTrigger>
                </TabsList>

                {(['pt-BR', 'en', 'es'] as const).map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Caption</Label>
                      <Input
                        value={editingImage.caption?.[lang] || ''}
                        onChange={(e) =>
                          setEditingImage({
                            ...editingImage,
                            caption: {
                              ...editingImage.caption,
                              [lang]: e.target.value,
                            },
                          })
                        }
                        placeholder={`Image caption in ${lang}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Alt Text</Label>
                      <Input
                        value={editingImage.altText?.[lang] || ''}
                        onChange={(e) =>
                          setEditingImage({
                            ...editingImage,
                            altText: {
                              ...editingImage.altText,
                              [lang]: e.target.value,
                            },
                          })
                        }
                        placeholder={`Alt text in ${lang}`}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingImage(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveImageEdit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}