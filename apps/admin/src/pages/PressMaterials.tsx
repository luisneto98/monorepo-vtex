import { useState, useCallback, useMemo } from 'react';
import { Plus, Grid, List, Download, Upload } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
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
import { BulkActions } from '@/components/press-materials/BulkActions';
import { TagAdditionModal } from '@/components/press-materials/TagAdditionModal';

// Hooks
import { usePressMaterials } from '@/hooks/usePressMaterials';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMaterialFilters } from '@/hooks/useMaterialFilters';
import { useToast } from '@/hooks/useToast';

// Types
import type { PressMaterial, PressMaterialType } from '@shared/types/press-materials';
import { pressMaterialsService } from '@/services/press-materials.service';
import DOMPurify from 'dompurify';

export function PressMaterials() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | PressMaterialType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<PressMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<PressMaterial | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

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
    deleteMany,
    updateStatus,
    updateAccess,
    addTags,
  } = usePressMaterials(queryParams);

  // File upload
  const {
    uploadQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    retryUpload,
  } = useFileUpload();

  // Selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(materials.map(m => m._id!)));
    } else {
      setSelectedIds(new Set());
    }
  }, [materials]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

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

  const handleBulkDownload = useCallback(async () => {
    if (selectedIds.size === 0) return;

    try {
      const blob = await pressMaterialsService.downloadMultiple(Array.from(selectedIds));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize filename to prevent DOM injection
      const sanitizedFilename = DOMPurify.sanitize('press-materials.zip', {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
      a.download = sanitizedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download concluído',
        description: `${selectedIds.size} arquivo(s) baixado(s)`,
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar os arquivos',
        variant: 'destructive',
      });
    }
  }, [selectedIds, toast]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;

    if (confirm(`Tem certeza que deseja excluir ${selectedIds.size} material(is)?`)) {
      deleteMany(Array.from(selectedIds));
      clearSelection();
    }
  }, [selectedIds, deleteMany, clearSelection]);

  const handleBulkStatus = useCallback((status: 'draft' | 'published' | 'archived') => {
    if (selectedIds.size === 0) return;
    updateStatus({ ids: Array.from(selectedIds), status });
    clearSelection();
  }, [selectedIds, updateStatus, clearSelection]);

  const handleBulkAccess = useCallback((accessLevel: 'public' | 'restricted') => {
    if (selectedIds.size === 0) return;
    updateAccess({ ids: Array.from(selectedIds), accessLevel });
    clearSelection();
  }, [selectedIds, updateAccess, clearSelection]);

  const handleBulkTags = useCallback(() => {
    setShowTagModal(true);
  }, []);

  const handleAddTags = useCallback((tags: string[]) => {
    if (tags.length > 0 && selectedIds.size > 0) {
      addTags({
        ids: Array.from(selectedIds),
        tags,
      });
      clearSelection();
    }
  }, [selectedIds, addTags, clearSelection]);

  const handleUpload = useCallback(async (files: File[]) => {
    await addToQueue(files);
    setShowUploadDialog(false);
    await processQueue();
    refetch();
  }, [addToQueue, processQueue, refetch]);

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
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Materiais de Imprensa</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                // TODO: Implement export functionality
                toast({
                  title: 'Em desenvolvimento',
                  description: 'Funcionalidade de exportação será implementada em breve',
                  variant: 'default',
                });
              }}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Lista
              </Button>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload de Arquivos
              </Button>
            </div>
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

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <BulkActions
              selectedCount={selectedIds.size}
              onDelete={handleBulkDelete}
              onDownload={handleBulkDownload}
              onStatusChange={handleBulkStatus}
              onAccessChange={handleBulkAccess}
              onTagAdd={handleBulkTags}
              onClear={clearSelection}
            />
          )}

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
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onDelete={deleteMaterial}
                onPreview={handlePreview}
                onDownload={handleDownload}
                loading={loading}
              />
            ) : (
              <MaterialsList
                materials={materials}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
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

        {/* Tag Addition Modal */}
        <TagAdditionModal
          open={showTagModal}
          onClose={() => setShowTagModal(false)}
          onAddTags={handleAddTags}
          selectedCount={selectedIds.size}
        />
      </div>
    </Layout>
  );
}