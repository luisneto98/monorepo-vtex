import { Trash2, Download, Archive, Eye, EyeOff, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onDownload: () => void;
  onStatusChange: (status: 'draft' | 'published' | 'archived') => void;
  onAccessChange: (access: 'public' | 'restricted') => void;
  onTagAdd: () => void;
  onClear: () => void;
}

export function BulkActions({
  selectedCount,
  onDelete,
  onDownload,
  onStatusChange,
  onAccessChange,
  onTagAdd,
  onClear,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Badge variant="secondary" className="bg-blue-100">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </Badge>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Alterar Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusChange('draft')}>
              Rascunho
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('published')}>
              Publicado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('archived')}>
              <Archive className="w-4 h-4 mr-2" />
              Arquivado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Alterar Acesso
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Nível de Acesso</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAccessChange('public')}>
              <Eye className="w-4 h-4 mr-2" />
              Público
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAccessChange('restricted')}>
              <EyeOff className="w-4 h-4 mr-2" />
              Restrito
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={onTagAdd}>
          <Tag className="w-4 h-4 mr-2" />
          Adicionar Tags
        </Button>

        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir
        </Button>
      </div>

      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar Seleção
        </Button>
      </div>
    </div>
  );
}