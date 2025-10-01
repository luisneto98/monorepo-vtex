import { useState } from 'react';
import {
  Download,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  FileText,
  Film,
  Image,
  Package,
  Presentation
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PressMaterial } from '@shared/types/press-materials';

interface MaterialCardProps {
  material: PressMaterial;
  onEdit?: (material: PressMaterial) => void;
  onDelete?: (id: string) => void;
  onPreview?: (material: PressMaterial) => void;
  onDownload?: (material: PressMaterial) => void;
}

const typeIcons = {
  press_kit: Package,
  logo_package: Image,
  photo: Image,
  video: Film,
  presentation: Presentation,
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

export function MaterialCard({
  material,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
}: MaterialCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = typeIcons[material.type] || FileText;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className={cn(
        'relative bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200',
        isHovered && 'shadow-lg border-blue-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Thumbnail Area */}
      <div className="relative aspect-video bg-gray-100">
        {material.thumbnailUrl ? (
          <img
            src={material.thumbnailUrl}
            alt={material.title.pt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Icon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPreview?.(material)}
            className="pointer-events-auto"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDownload?.(material)}
            className="pointer-events-auto"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={statusColors[material.status]}>
            {statusLabels[material.status]}
          </Badge>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate" title={material.title.pt}>
              {material.title.pt}
            </h3>
            {material.description?.pt && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {material.description.pt}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(material)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview?.(material)}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload?.(material)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(material._id!)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{formatFileSize(material.metadata.size)}</span>
          <span>{material.metadata.format.toUpperCase()}</span>
          <span>{material.downloadCount} downloads</span>
        </div>

        {/* Tags */}
        {material.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{material.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}