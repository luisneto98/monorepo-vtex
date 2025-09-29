import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { PressMaterialFilters, PressMaterialType, PublicationStatus, AccessLevel } from '@shared/types/press-materials';

interface SearchFiltersProps {
  filters: PressMaterialFilters;
  onFiltersChange: (filters: PressMaterialFilters) => void;
  onSearch: (search: string) => void;
  onClear: () => void;
  availableTags?: string[];
}

const materialTypes: { value: PressMaterialType; label: string }[] = [
  { value: 'press_kit', label: 'Press Kit' },
  { value: 'logo_package', label: 'Pacote de Logos' },
  { value: 'photo', label: 'Foto' },
  { value: 'video', label: 'Vídeo' },
  { value: 'presentation', label: 'Apresentação' },
];

const statusOptions: { value: PublicationStatus; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Arquivado' },
];

const accessOptions: { value: AccessLevel; label: string }[] = [
  { value: 'public', label: 'Público' },
  { value: 'restricted', label: 'Restrito' },
];

export function SearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  availableTags = [],
}: SearchFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(filters.tags || [])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  const handleTypeChange = (type: PressMaterialType, checked: boolean) => {
    if (checked && filters.type !== type) {
      onFiltersChange({ ...filters, type });
    } else if (!checked && filters.type === type) {
      onFiltersChange({ ...filters, type: undefined });
    }
  };

  const handleStatusChange = (status: PublicationStatus, checked: boolean) => {
    if (checked && filters.status !== status) {
      onFiltersChange({ ...filters, status });
    } else if (!checked && filters.status === status) {
      onFiltersChange({ ...filters, status: undefined });
    }
  };

  const handleAccessChange = (access: AccessLevel, checked: boolean) => {
    if (checked && filters.accessLevel !== access) {
      onFiltersChange({ ...filters, accessLevel: access });
    } else if (!checked && filters.accessLevel === access) {
      onFiltersChange({ ...filters, accessLevel: undefined });
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
    onFiltersChange({ ...filters, tags: Array.from(newTags) });
  };

  const activeFiltersCount = [
    filters.type,
    filters.status,
    filters.accessLevel,
    filters.tags?.length,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchValue('');
    setSelectedTags(new Set());
    onClear();
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Tipo
              {filters.type && (
                <Badge variant="secondary" className="ml-2">
                  1
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tipo de Material</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {materialTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={filters.type === type.value}
                onCheckedChange={(checked: boolean) => handleTypeChange(type.value, checked)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status
              {filters.status && (
                <Badge variant="secondary" className="ml-2">
                  1
                </Badge>
              )}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={filters.status === status.value}
                onCheckedChange={(checked: boolean) => handleStatusChange(status.value, checked)}
              >
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Advanced Filters */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Filtros Avançados</h4>
              </div>

              {/* Access Level */}
              <div>
                <Label>Nível de Acesso</Label>
                <div className="space-y-2 mt-2">
                  {accessOptions.map((access) => (
                    <label
                      key={access.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.accessLevel === access.value}
                        onCheckedChange={(checked) =>
                          handleAccessChange(access.value, !!checked)
                        }
                      />
                      <span className="text-sm">{access.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                    {availableTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedTags.has(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowAdvanced(false);
                    clearAllFilters();
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={clearAllFilters}>
          <X className="w-4 h-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Active Filters Display */}
      {(activeFiltersCount > 0 || searchValue) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Filtros ativos:</span>

          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              Busca: {searchValue}
              <button
                onClick={() => setSearchValue('')}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {materialTypes.find(t => t.value === filters.type)?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, type: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.accessLevel && (
            <Badge variant="secondary" className="gap-1">
              Acesso: {accessOptions.find(a => a.value === filters.accessLevel)?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, accessLevel: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.tags && filters.tags.length > 0 && (
            filters.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                Tag: {tag}
                <button
                  onClick={() => {
                    const newTags = new Set(selectedTags);
                    newTags.delete(tag);
                    setSelectedTags(newTags);
                    onFiltersChange({
                      ...filters,
                      tags: Array.from(newTags),
                    });
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}