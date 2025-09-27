import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { SessionsService } from '@/services/sessions.service';
import type { ISession } from '@shared/types/session.types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';

interface SessionsListProps {
  onEdit: (session: ISession) => void;
  onAdd: () => void;
  onPreview: (session: ISession) => void;
}

type SortField = 'title' | 'startTime' | 'stage' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function SessionsList({ onEdit, onAdd, onPreview }: SessionsListProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Available filters (to be populated from API)
  // const [availableStages, setAvailableStages] = useState<string[]>([]);
  // const [availableTags, setAvailableTags] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: currentPage,
        limit: pageSize,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      if (stageFilter !== 'all') {
        params.stage = stageFilter;
      }

      if (tagFilter !== 'all') {
        params.tags = tagFilter;
      }

      if (dateRangeFilter !== 'all') {
        params.date = dateRangeFilter;
      }

      const response = await SessionsService.getSessions(params);

      if (response.success && response.data) {
        setSessions(response.data);

        if (response.metadata) {
          setTotalPages(Math.ceil(response.metadata.total / response.metadata.limit));
          setTotalItems(response.metadata.total);
        }
      }
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, stageFilter, tagFilter, dateRangeFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    // Add confirmation dialog before deletion
    const confirmed = window.confirm('Are you sure you want to delete this session? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await SessionsService.deleteSession(id);
      toast({
        title: 'Success',
        description: 'Session deleted successfully',
      });
      fetchSessions();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (session: ISession) => {
    try {
      const duplicated = {
        ...session,
        _id: undefined,
        title: {
          'pt-BR': `${session.title['pt-BR']} (Copy)`,
          'en': `${session.title['en']} (Copy)`,
        },
        createdAt: undefined,
        updatedAt: undefined,
      };

      await SessionsService.createSession(duplicated as Omit<ISession, '_id' | 'createdAt' | 'updatedAt'>);
      toast({
        title: 'Success',
        description: 'Session duplicated successfully',
      });
      fetchSessions();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate session',
        variant: 'destructive',
      });
    }
  };

  const handleToggleVisibility = async (session: ISession) => {
    try {
      await SessionsService.updateSession(session._id.toString(), {
        isVisible: !session.isVisible,
      });
      toast({
        title: 'Success',
        description: `Session ${session.isVisible ? 'hidden' : 'shown'} successfully`,
      });
      fetchSessions();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update session visibility',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (start: Date, end: Date) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load sessions</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => fetchSessions()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="main">Main Stage</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="keynote">Keynote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Session
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  <SortIcon field="title" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center gap-1">
                  Date/Time
                  <SortIcon field="startTime" />
                </div>
              </TableHead>
              <TableHead>Duration</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort('stage')}
              >
                <div className="flex items-center gap-1">
                  Stage
                  <SortIcon field="stage" />
                </div>
              </TableHead>
              <TableHead>Speakers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session._id.toString()}>
                <TableCell className="font-medium">
                  {session.title['en']}
                  {session.isHighlight && (
                    <Badge className="ml-2" variant="secondary">
                      Highlight
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(parseISO(session.startTime.toString()), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {formatDuration(session.startTime, session.endTime)}
                </TableCell>
                <TableCell>{session.stage}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {session.speakerIds?.length || 0} speaker(s)
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={session.isVisible ? 'default' : 'secondary'}>
                    {session.isVisible ? 'Visible' : 'Hidden'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(session)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPreview(session)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(session)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleVisibility(session)}>
                        {session.isVisible ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Show
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(session._id.toString())}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} sessions
          </span>
          <Select value={pageSize.toString()} onValueChange={(value: string) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {totalPages > 5 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}