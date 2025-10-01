import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Grid, List, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Components
import { MaterialsGrid } from '@/components/press-materials/MaterialsGrid';
import { MaterialsList } from '@/components/press-materials/MaterialsList';
import { FileUploadZone } from '@/components/press-materials/FileUploadZone';
import { UploadQueue } from '@/components/press-materials/UploadQueue';
import { MaterialEditModal } from '@/components/press-materials/MaterialEditModal';
import { PreviewModal } from '@/components/press-materials/PreviewModal';
import { SearchFilters } from '@/components/press-materials/SearchFilters';
import { FileMetadataModal, type FileMetadata } from '@/components/press-materials/FileMetadataModal';

// Hooks
import { usePressMaterials } from '@/hooks/usePressMaterials';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMaterialFilters } from '@/hooks/useMaterialFilters';
import { useToast } from '@/hooks/useToast';

// Types
import type { PressMaterial, PressMaterialType } from '@shared/types/press-materials';
import { pressMaterialsService } from '@/services/press-materials.service';

export function PressMaterials() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | PressMaterialType>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<PressMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<PressMaterial | null>(null);
  const [filesAwaitingMetadata, setFilesAwaitingMetadata] = useState<File[]>([]);
  const [currentMetadataIndex, setCurrentMetadataIndex] = useState(0);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  // Filters and pagination
  const {
    filters,
    setFilter,
    clearFilters,
    setPage,
    getQueryParams,
  } = useMaterialFilters();

  // Apply tab filter
  const queryParams = useMemo(() => {
    const params = getQueryParams();
    if (activeTab !== 'all') {
      return {
        ...params,
        filters: {
          ...params.filters,
          type: activeTab,
        },
      };
    }
    return params;
  }, [activeTab, getQueryParams]);

  // Data fetching
  const {
    materials,
    total,
    page,
    totalPages,
    loading,
    refetch,
    updateMaterial,
    deleteMaterial,
  } = usePressMaterials(queryParams);

  // File upload
  const {
    uploadQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    retryUpload,
    updateFileMetadata,
  } = useFileUpload();


  // Action handlers
  const handleEdit = useCallback((material: PressMaterial) => {
    setEditingMaterial(material);
  }, []);

  const handlePreview = useCallback((material: PressMaterial) => {
    setPreviewMaterial(material);
  }, []);

  const handleDownload = useCallback(async (material: PressMaterial) => {
    try {
      await pressMaterialsService.createDownloadLink(material);
      toast({
        title: 'Download iniciado',
        description: `Baixando ${material.title.pt}`,
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleUpload = useCallback(async (files: File[]) => {
    // Close upload dialog and show metadata configuration flow
    setShowUploadDialog(false);
    setFilesAwaitingMetadata(files);
    setCurrentMetadataIndex(0);
    setShowMetadataModal(true);
  }, []);

  const detectMaterialType = useCallback((file: File): PressMaterialType => {
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
  }, []);

  const [filesMetadata, setFilesMetadata] = useState<Map<number, FileMetadata>>(new Map());
  const [shouldProcessQueue, setShouldProcessQueue] = useState(false);

  // Effect to process queue after files are added with metadata
  useEffect(() => {
    if (shouldProcessQueue && uploadQueue.length > 0) {
      const pendingCount = uploadQueue.filter(f => f.status === 'pending').length;
      console.log('Effect triggered - uploadQueue length:', uploadQueue.length, 'pending:', pendingCount);

      setShouldProcessQueue(false);

      // Process queue
      processQueue().then(() => {
        refetch();
      });
    }
  }, [shouldProcessQueue, uploadQueue, processQueue, refetch]);

  const handleMetadataSave = useCallback(async (metadata: FileMetadata) => {
    // Move to next file or finish
    if (currentMetadataIndex < filesAwaitingMetadata.length - 1) {
      // Store metadata and move to next
      setFilesMetadata(prev => {
        const newMap = new Map(prev);
        newMap.set(currentMetadataIndex, metadata);
        return newMap;
      });
      setCurrentMetadataIndex(currentMetadataIndex + 1);
    } else {
      // Last file - store metadata and process all
      const finalMetadata = new Map(filesMetadata);
      finalMetadata.set(currentMetadataIndex, metadata);

      // Close modal
      setShowMetadataModal(false);

      // Add all files to queue with their metadata
      for (let i = 0; i < filesAwaitingMetadata.length; i++) {
        const file = filesAwaitingMetadata[i];
        const fileMetadata = finalMetadata.get(i);

        const validatedFiles = await addToQueue([file]);
        const fileInQueue = validatedFiles[0];

        if (fileInQueue && fileInQueue.status === 'pending' && fileMetadata) {
          // Update the file with custom metadata (always public)
          updateFileMetadata(fileInQueue.id, {
            type: fileMetadata.type,
            title: fileMetadata.title,
            description: fileMetadata.description,
            status: fileMetadata.status,
            accessLevel: 'public',
          });
        }
      }

      // Reset state
      setFilesAwaitingMetadata([]);
      setCurrentMetadataIndex(0);
      setFilesMetadata(new Map());

      // Trigger queue processing via useEffect
      setShouldProcessQueue(true);
    }
  }, [filesAwaitingMetadata, currentMetadataIndex, filesMetadata, addToQueue, updateFileMetadata]);

  const handleMetadataSkip = useCallback(async () => {
    // Move to next file or finish
    if (currentMetadataIndex < filesAwaitingMetadata.length - 1) {
      // Just move to next, don't store metadata (will use default)
      setCurrentMetadataIndex(currentMetadataIndex + 1);
    } else {
      // Last file - process all with stored metadata (skipped files will use defaults)
      setShowMetadataModal(false);

      // Add all files to queue
      for (let i = 0; i < filesAwaitingMetadata.length; i++) {
        const file = filesAwaitingMetadata[i];
        const fileMetadata = filesMetadata.get(i);

        const validatedFiles = await addToQueue([file]);
        const fileInQueue = validatedFiles[0];

        if (fileInQueue && fileInQueue.status === 'pending' && fileMetadata) {
          // Update the file with custom metadata (only for files that were configured, always public)
          updateFileMetadata(fileInQueue.id, {
            type: fileMetadata.type,
            title: fileMetadata.title,
            description: fileMetadata.description,
            status: fileMetadata.status,
            accessLevel: 'public',
          });
        }
        // Files without metadata will use defaults from addToQueue (also public)
      }

      // Reset state
      setFilesAwaitingMetadata([]);
      setCurrentMetadataIndex(0);
      setFilesMetadata(new Map());

      // Trigger queue processing via useEffect
      setShouldProcessQueue(true);
    }
  }, [filesAwaitingMetadata, currentMetadataIndex, filesMetadata, addToQueue, updateFileMetadata]);

  const handleMetadataCancel = useCallback(() => {
    setShowMetadataModal(false);
    setFilesAwaitingMetadata([]);
    setCurrentMetadataIndex(0);
  }, []);

  // Tab counts
  const tabCounts = useMemo(() => {
    // In real app, these would come from the API
    return {
      all: total,
      press_kit: materials.filter(m => m.type === 'press_kit').length,
      logo_package: materials.filter(m => m.type === 'logo_package').length,
      photo: materials.filter(m => m.type === 'photo').length,
      video: materials.filter(m => m.type === 'video').length,
      presentation: materials.filter(m => m.type === 'presentation').length,
    };
  }, [materials, total]);

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Materiais de Imprensa</h1>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload de Arquivos
            </Button>
          </div>
          <p className="text-gray-600">
            Gerencie materiais de imprensa, logos, fotos e vídeos do evento
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">
                Todos {tabCounts.all > 0 && `(${tabCounts.all})`}
              </TabsTrigger>
              <TabsTrigger value="press_kit">
                Press Kit {tabCounts.press_kit > 0 && `(${tabCounts.press_kit})`}
              </TabsTrigger>
              <TabsTrigger value="logo_package">
                Logos {tabCounts.logo_package > 0 && `(${tabCounts.logo_package})`}
              </TabsTrigger>
              <TabsTrigger value="photo">
                Fotos {tabCounts.photo > 0 && `(${tabCounts.photo})`}
              </TabsTrigger>
              <TabsTrigger value="video">
                Vídeos {tabCounts.video > 0 && `(${tabCounts.video})`}
              </TabsTrigger>
              <TabsTrigger value="presentation">
                Apresentações {tabCounts.presentation > 0 && `(${tabCounts.presentation})`}
              </TabsTrigger>
            </TabsList>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                aria-label="Visualização em grade"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                aria-label="Visualização em lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <SearchFilters
            filters={filters}
            onFiltersChange={(f) => Object.entries(f).forEach(([k, v]) => setFilter(k as any, v))}
            onSearch={(search) => setFilter('search', search)}
            onClear={clearFilters}
          />

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <UploadQueue
              files={uploadQueue}
              onRemove={removeFromQueue}
              onRetry={retryUpload}
              onClear={clearQueue}
            />
          )}

          {/* Content */}
          <TabsContent value={activeTab}>
            {materials.length === 0 && !loading ? (
              <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">
                    Nenhum material encontrado
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro material
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <MaterialsGrid
                materials={materials}
                onEdit={handleEdit}
                onDelete={deleteMaterial}
                onPreview={handlePreview}
                onDownload={handleDownload}
                loading={loading}
              />
            ) : (
              <MaterialsList
                materials={materials}
                onEdit={handleEdit}
                onDelete={deleteMaterial}
                onPreview={handlePreview}
                onDownload={handleDownload}
                loading={loading}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload de Materiais</DialogTitle>
            </DialogHeader>
            <FileUploadZone onUpload={handleUpload} />
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <MaterialEditModal
          open={!!editingMaterial}
          onClose={() => setEditingMaterial(null)}
          material={editingMaterial}
          onSave={async (id, data) => {
            updateMaterial({ id, data });
            setEditingMaterial(null);
          }}
        />

        {/* Preview Modal */}
        <PreviewModal
          open={!!previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          material={previewMaterial}
          onDownload={handleDownload}
        />

        {/* File Metadata Configuration Modal */}
        {filesAwaitingMetadata.length > 0 && (
          <FileMetadataModal
            open={showMetadataModal}
            fileName={filesAwaitingMetadata[currentMetadataIndex]?.name || ''}
            currentIndex={currentMetadataIndex}
            totalFiles={filesAwaitingMetadata.length}
            defaultMetadata={{
              type: detectMaterialType(filesAwaitingMetadata[currentMetadataIndex]),
              title: {
                pt: filesAwaitingMetadata[currentMetadataIndex]?.name.replace(/\.[^/.]+$/, '') || '',
                en: filesAwaitingMetadata[currentMetadataIndex]?.name.replace(/\.[^/.]+$/, '') || '',
                es: filesAwaitingMetadata[currentMetadataIndex]?.name.replace(/\.[^/.]+$/, '') || '',
              },
              description: {
                pt: '',
                en: '',
                es: '',
              },
              status: 'draft',
            }}
            onSave={handleMetadataSave}
            onSkip={handleMetadataSkip}
            onCancel={handleMetadataCancel}
          />
        )}
    </div>
  );
}