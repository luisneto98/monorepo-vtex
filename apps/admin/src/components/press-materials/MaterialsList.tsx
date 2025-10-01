import {
  Download,
  Eye,
  Edit,
  Trash2,
  Share2,
  MoreVertical,
  FileText,
  Film,
  Image,
  Package,
  Presentation
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PressMaterial } from '@shared/types/press-materials';

interface MaterialsListProps {
  materials: PressMaterial[];
  onEdit: (material: PressMaterial) => void;
  onDelete: (id: string) => void;
  onPreview: (material: PressMaterial) => void;
  onDownload: (material: PressMaterial) => void;
  loading?: boolean;
}

const typeIcons = {
  press_kit: Package,
  logo_package: Image,
  photo: Image,
  video: Film,
  presentation: Presentation,
};

const typeLabels = {
  press_kit: 'Press Kit',
  logo_package: 'Pacote de Logos',
  photo: 'Foto',
  video: 'Vídeo',
  presentation: 'Apresentação',
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

export function MaterialsList({
  materials,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  loading = false,
}: MaterialsListProps) {
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

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Downloads</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell colSpan={7}>
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (materials.length === 0) {
    return null;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Downloads</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.map((material) => {
          const Icon = typeIcons[material.type] || FileText;
          return (
            <TableRow key={material._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {material.title.pt}
                    </p>
                    {material.description?.pt && (
                      <p className="text-sm text-gray-500 truncate">
                        {material.description.pt}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {typeLabels[material.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[material.status]}>
                  {statusLabels[material.status]}
                </Badge>
              </TableCell>
              <TableCell>{formatFileSize(material.metadata.size)}</TableCell>
              <TableCell>{material.downloadCount}</TableCell>
              <TableCell>{formatDate(material.createdAt)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(material)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPreview(material)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownload(material)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(material._id!)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}