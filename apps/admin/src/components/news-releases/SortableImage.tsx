import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ImageGalleryItem } from '@shared/types/news-releases';
import { Button } from '../ui/button';
import { GripVertical, Trash, Edit } from 'lucide-react';

interface SortableImageProps {
  image: ImageGalleryItem;
  onDelete: (id: string) => void;
  onEdit: (image: ImageGalleryItem) => void;
}

export function SortableImage({ image, onDelete, onEdit }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image._id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group border rounded-lg overflow-hidden"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-move bg-white/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={() => onEdit(image)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={() => onDelete(image._id!)}
        >
          <Trash className="h-3 w-3" />
        </Button>
      </div>

      <img
        src={image.thumbnailUrl || image.url}
        alt={image.altText?.['en'] || ''}
        className="w-full h-32 object-cover"
      />

      {image.caption?.['en'] && (
        <div className="p-2 bg-muted">
          <p className="text-xs truncate">{image.caption['en']}</p>
        </div>
      )}
    </div>
  );
}