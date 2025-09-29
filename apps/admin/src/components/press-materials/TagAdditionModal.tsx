import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

interface TagAdditionModalProps {
  open: boolean;
  onClose: () => void;
  onAddTags: (tags: string[]) => void;
  selectedCount: number;
}

export function TagAdditionModal({
  open,
  onClose,
  onAddTags,
  selectedCount,
}: TagAdditionModalProps) {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const sanitizeTag = (tag: string): string => {
    // Remove HTML tags and dangerous characters
    const sanitized = DOMPurify.sanitize(tag, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // Additional validation: only allow alphanumeric, spaces, hyphens, and underscores
    return sanitized.replace(/[^\w\s\-]/g, '').trim();
  };

  const addTag = () => {
    if (!tagInput.trim()) return;

    const sanitizedTag = sanitizeTag(tagInput);
    if (!sanitizedTag) return;

    if (!tags.includes(sanitizedTag) && sanitizedTag.length <= 50) {
      setTags([...tags, sanitizedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = () => {
    if (tags.length > 0) {
      onAddTags(tags);
      setTags([]);
      setTagInput('');
      onClose();
    }
  };

  const handleClose = () => {
    setTags([]);
    setTagInput('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Adicionar tags para {selectedCount} material(is) selecionado(s)
          </p>

          <div className="space-y-2">
            <Label htmlFor="tag-input">Nova Tag</Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite uma tag e pressione Enter ou vírgula"
                maxLength={50}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Pressione Enter ou vírgula para adicionar. Máximo 50 caracteres por tag.
            </p>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags a serem adicionadas:</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={tags.length === 0}
          >
            Adicionar Tags ({tags.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}