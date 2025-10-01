import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PressMaterialType } from '@shared/types/press-materials';

export interface FileMetadata {
  type: PressMaterialType;
  title: {
    pt: string;
    en: string;
    es: string;
  };
  description?: {
    pt: string;
    en: string;
    es: string;
  };
  status: 'draft' | 'published';
}

interface FileMetadataModalProps {
  open: boolean;
  fileName: string;
  currentIndex: number;
  totalFiles: number;
  defaultMetadata: FileMetadata;
  onSave: (metadata: FileMetadata) => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function FileMetadataModal({
  open,
  fileName,
  currentIndex,
  totalFiles,
  defaultMetadata,
  onSave,
  onSkip,
  onCancel,
}: FileMetadataModalProps) {
  const [formData, setFormData] = useState<FileMetadata>(defaultMetadata);

  // Only reset form data when the file changes (currentIndex changes)
  useEffect(() => {
    setFormData(defaultMetadata);
  }, [currentIndex]); // Changed from defaultMetadata to currentIndex

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Configurar Arquivo ({currentIndex + 1}/{totalFiles})
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-700">{fileName}</span>
            <br />
            Configure o título, descrição e tipo do material
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Material *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: PressMaterialType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="press_kit">Press Kit</SelectItem>
                <SelectItem value="logo_package">Pacote de Logos</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="presentation">Apresentação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Tabs defaultValue="pt" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pt">PT</TabsTrigger>
                <TabsTrigger value="en">EN</TabsTrigger>
                <TabsTrigger value="es">ES</TabsTrigger>
              </TabsList>
              <TabsContent value="pt" className="space-y-2">
                <Input
                  placeholder="Título em português"
                  value={formData.title.pt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, pt: e.target.value },
                    })
                  }
                />
              </TabsContent>
              <TabsContent value="en" className="space-y-2">
                <Input
                  placeholder="Title in English"
                  value={formData.title.en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, en: e.target.value },
                    })
                  }
                />
              </TabsContent>
              <TabsContent value="es" className="space-y-2">
                <Input
                  placeholder="Título en español"
                  value={formData.title.es}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, es: e.target.value },
                    })
                  }
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Tabs defaultValue="pt" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pt">PT</TabsTrigger>
                <TabsTrigger value="en">EN</TabsTrigger>
                <TabsTrigger value="es">ES</TabsTrigger>
              </TabsList>
              <TabsContent value="pt" className="space-y-2">
                <Textarea
                  placeholder="Descrição em português"
                  value={formData.description?.pt || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        pt: e.target.value,
                        en: formData.description?.en || '',
                        es: formData.description?.es || '',
                      },
                    })
                  }
                  rows={3}
                />
              </TabsContent>
              <TabsContent value="en" className="space-y-2">
                <Textarea
                  placeholder="Description in English"
                  value={formData.description?.en || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        pt: formData.description?.pt || '',
                        en: e.target.value,
                        es: formData.description?.es || '',
                      },
                    })
                  }
                  rows={3}
                />
              </TabsContent>
              <TabsContent value="es" className="space-y-2">
                <Textarea
                  placeholder="Descripción en español"
                  value={formData.description?.es || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        pt: formData.description?.pt || '',
                        en: formData.description?.en || '',
                        es: e.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'published') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar Todos
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Pular
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.title.pt || !formData.title.en || !formData.title.es}
          >
            {currentIndex < totalFiles - 1 ? 'Próximo' : 'Finalizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
