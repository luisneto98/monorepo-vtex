import { useState, useEffect, useCallback } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Search, Plus, Edit, Trash2, Eye, EyeOff, Building, Copy, Archive } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Sponsor } from '@shared/types/sponsor.types';
import { SponsorsService, type ISponsorListResponse } from '@/services/sponsors.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SponsorsListProps {
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (sponsor: Sponsor) => void;
  onAdd: () => void;
  onDuplicate?: (sponsor: Sponsor) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  refreshTrigger?: number;
  showArchived?: boolean;
}

export interface SponsorsFilters {
  page?: number;
  limit?: number;
  sort?: string;
  tier?: string;
  search?: string;
  visibility?: 'all' | 'visible' | 'hidden';
  standLocation?: string;
}

export function SponsorsList({ onEdit, onDelete, onAdd, onDuplicate, onSelectionChange, refreshTrigger, showArchived = false }: SponsorsListProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [searchDebounce, setSearchDebounce] = useState<number | null>(null);

  const fetchSponsors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: SponsorsFilters = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
      };

      if (tierFilter !== 'all') {
        filters.tier = tierFilter;
      }

      if (sorting.length > 0) {
        const sort = sorting[0];
        filters.sort = `${sort.desc ? '-' : ''}${sort.id}`;
      }

      const response: ISponsorListResponse = showArchived
        ? await SponsorsService.getArchivedSponsors()
        : await SponsorsService.getSponsors(filters);
      setSponsors(response.data);
      setPagination({
        ...pagination,
        total: response.total,
        hasNext: response.page * response.limit < response.total,
        hasPrev: response.page > 1,
      });
    } catch (err) {
      setError('Failed to load sponsors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, tierFilter, sorting]);

  useEffect(() => {
    fetchSponsors();
  }, [pagination.page, pagination.limit, sorting, refreshTrigger]);

  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      fetchSponsors();
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm, tierFilter, visibilityFilter]);

  const toggleVisibility = async (sponsor: Sponsor) => {
    try {
      await SponsorsService.updateSponsor(sponsor._id || '', {
        isVisible: !sponsor.isVisible,
      });
      fetchSponsors();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      setError('Failed to update sponsor visibility');
    }
  };

  const handleRowSelection = (sponsorId: string, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(sponsorId);
    } else {
      newSelection.delete(sponsorId);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = sponsors.map(s => s._id || '').filter(Boolean);
      setSelectedRows(new Set(allIds));
      onSelectionChange?.(allIds);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const columns: ColumnDef<Sponsor>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={sponsors.length > 0 && selectedRows.size === sponsors.length}
          onCheckedChange={(value: boolean | 'indeterminate') => handleSelectAll(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.has(row.original._id || '')}
          onCheckedChange={(value: boolean | 'indeterminate') => handleRowSelection(row.original._id || '', !!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'logoUrl',
      header: 'Logo',
      cell: ({ row }) => (
        <img
          src={row.getValue('logoUrl') || '/placeholder-logo.png'}
          alt={row.original.name}
          className="w-12 h-12 object-contain border rounded"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
    },
    {
      accessorKey: 'tier',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Tier
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.tier}</Badge>
      ),
    },
    {
      accessorKey: 'orderInTier',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Order
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.orderInTier}</Badge>
      ),
    },
    {
      accessorKey: 'postsUsed',
      header: 'Posts Usage',
      cell: ({ row }) => {
        const maxPosts = row.original.maxPosts || 0;
        const postsUsed = row.original.postsUsed || 0;
        const percentage = maxPosts > 0 ? (postsUsed / maxPosts) * 100 : 0;

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{postsUsed}/{maxPosts}</span>
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percentage >= 100 ? 'bg-destructive' :
                  percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'standLocation',
      header: 'Stand',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.standLocation ? (
            <>
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{row.original.standLocation}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isVisible',
      header: 'Visibility',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleVisibility(row.original)}
          className="gap-2"
        >
          {row.original.isVisible ? (
            <>
              <Eye className="h-4 w-4" />
              <span>Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span>Hidden</span>
            </>
          )}
        </Button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
            aria-label={`Edit ${row.original.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDuplicate(row.original)}
              aria-label={`Duplicate ${row.original.name}`}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
            aria-label={`${showArchived ? 'Permanently delete' : 'Archive'} ${row.original.name}`}
          >
            {showArchived ? (
              <Trash2 className="h-4 w-4 text-destructive" />
            ) : (
              <Archive className="h-4 w-4 text-warning" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: sponsors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sponsors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <option value="all">All Tiers</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </Select>

          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </Select>
        </div>

        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No sponsors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {sponsors.length} of {pagination.total} sponsors
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}