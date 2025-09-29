import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PressMaterial, UpdatePressMaterialDto } from '@shared/types/press-materials';

interface MaterialEditModalProps {
  open: boolean;
  onClose: () => void;
  material: PressMaterial | null;
  onSave: (id: string, data: UpdatePressMaterialDto) => Promise<void>;
}

export function MaterialEditModal({
  open,
  onClose,
  material,
  onSave,
}: MaterialEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdatePressMaterialDto>({
    title: { pt: '', en: '', es: '' },
    description: { pt: '', en: '', es: '' },
    tags: [],
    status: 'draft',
    accessLevel: 'public',
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title,
        description: material.description || { pt: '', en: '', es: '' },
        tags: material.tags,
        status: material.status,
        accessLevel: material.accessLevel,
      });
    }
  }, [material]);

  const handleSubmit = async () => {
    if (!material) return;

    setLoading(true);
    try {
      await onSave(material._id!, formData);
      onClose();
    } catch (error) {
      console.error('Error saving material:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Material</DialogTitle>
          <DialogDescription>
            Atualize as informações do material de imprensa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language Tabs */}
          <Tabs defaultValue="pt">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pt">Português</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
            </TabsList>

            <TabsContent value="pt" className="space-y-4">
              <div>
                <Label htmlFor="title-pt">Título</Label>
                <Input
                  id="title-pt"
                  value={formData.title?.pt || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title!, pt: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description-pt">Descrição</Label>
                <Textarea
                  id="description-pt"
                  rows={3}
                  value={formData.description?.pt || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        ...formData.description!,
                        pt: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div>
                <Label htmlFor="title-en">Title</Label>
                <Input
                  id="title-en"
                  value={formData.title?.en || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title!, en: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description-en">Description</Label>
                <Textarea
                  id="description-en"
                  rows={3}
                  value={formData.description?.en || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        ...formData.description!,
                        en: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="es" className="space-y-4">
              <div>
                <Label htmlFor="title-es">Título</Label>
                <Input
                  id="title-es"
                  value={formData.title?.es || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title!, es: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description-es">Descripción</Label>
                <Textarea
                  id="description-es"
                  rows={3}
                  value={formData.description?.es || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: {
                        ...formData.description!,
                        es: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Status and Access */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="access">Nível de Acesso</Label>
              <Select
                value={formData.accessLevel}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, accessLevel: value })
                }
              >
                <SelectTrigger id="access">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="restricted">Restrito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Adicionar tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* File Information (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Informações do Arquivo</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Tipo:</span>{' '}
                <span className="font-medium">{material.type}</span>
              </div>
              <div>
                <span className="text-gray-500">Formato:</span>{' '}
                <span className="font-medium">{material.metadata.format.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-500">Tamanho:</span>{' '}
                <span className="font-medium">
                  {(material.metadata.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-gray-500">Downloads:</span>{' '}
                <span className="font-medium">{material.downloadCount}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}