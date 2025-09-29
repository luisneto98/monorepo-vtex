import { useState } from 'react';
import { Download, Share2, Maximize2, Minimize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PressMaterial } from '@shared/types/press-materials';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  material: PressMaterial | null;
  onDownload?: (material: PressMaterial) => void;
  onShare?: (material: PressMaterial) => void;
}

export function PreviewModal({
  open,
  onClose,
  material,
  onDownload,
  onShare,
}: PreviewModalProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  if (!material) return null;

  const renderPreview = () => {
    const fileType = material.metadata.format.toLowerCase();

    // Image preview
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <img
            src={material.fileUrl}
            alt={material.title.pt}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // Video preview
    if (['mp4', 'webm', 'mov'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <video
            src={material.fileUrl}
            controls
            className="max-w-full max-h-full"
          >
            Seu navegador não suporta a reprodução de vídeo.
          </video>
        </div>
      );
    }

    // PDF preview
    if (fileType === 'pdf') {
      return (
        <iframe
          src={material.fileUrl}
          className="w-full h-full"
          title={material.title.pt}
        />
      );
    }

    // Default preview for other types
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {material.title.pt}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {material.metadata.format.toUpperCase()} • {formatFileSize(material.metadata.size)}
        </p>
        <Button onClick={() => onDownload?.(material)}>
          <Download className="w-4 h-4 mr-2" />
          Download para visualizar
        </Button>
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabels = {
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={fullscreen ? 'sm:max-w-[90vw] h-[90vh]' : 'sm:max-w-[800px] h-[600px]'}
      >
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>{material.title.pt}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreen(!fullscreen)}
              >
                {fullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(material)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onDownload?.(material)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="metadata">Metadados</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 mt-4">
            <div className="h-full rounded-lg overflow-hidden border">
              {renderPreview()}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <Badge className={statusColors[material.status]}>
                    {statusLabels[material.status]}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Nível de Acesso</h4>
                  <p className="text-sm">
                    {material.accessLevel === 'public' ? 'Público' : 'Restrito'}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Downloads</h4>
                  <p className="text-sm">{material.downloadCount}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {material.tags.length > 0 ? (
                      material.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Sem tags</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Descrição</h4>
                  <Tabs defaultValue="pt" className="w-full">
                    <TabsList className="h-8">
                      <TabsTrigger value="pt" className="text-xs">PT</TabsTrigger>
                      <TabsTrigger value="en" className="text-xs">EN</TabsTrigger>
                      <TabsTrigger value="es" className="text-xs">ES</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pt">
                      <p className="text-sm text-gray-700">
                        {material.description?.pt || 'Sem descrição'}
                      </p>
                    </TabsContent>
                    <TabsContent value="en">
                      <p className="text-sm text-gray-700">
                        {material.description?.en || 'No description'}
                      </p>
                    </TabsContent>
                    <TabsContent value="es">
                      <p className="text-sm text-gray-700">
                        {material.description?.es || 'Sin descripción'}
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Enviado por</h4>
                  <p className="text-sm">{material.uploadedBy}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Data de Upload</h4>
                  <p className="text-sm">{formatDate(material.createdAt)}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="mt-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Tipo de Material</h4>
                  <p className="text-sm mt-1">{material.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Formato</h4>
                  <p className="text-sm mt-1">{material.metadata.format.toUpperCase()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Tamanho</h4>
                  <p className="text-sm mt-1">{formatFileSize(material.metadata.size)}</p>
                </div>
                {material.metadata.width && material.metadata.height && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Dimensões</h4>
                      <p className="text-sm mt-1">
                        {material.metadata.width} x {material.metadata.height} pixels
                      </p>
                    </div>
                  </>
                )}
                {material.metadata.duration && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Duração</h4>
                    <p className="text-sm mt-1">
                      {Math.floor(material.metadata.duration / 60)}:
                      {String(material.metadata.duration % 60).padStart(2, '0')}
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t">
                <h4 className="text-sm font-medium text-gray-500 mb-2">URL do Arquivo</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={material.fileUrl}
                    className="flex-1 text-sm px-3 py-1 bg-white border rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(material.fileUrl)}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}