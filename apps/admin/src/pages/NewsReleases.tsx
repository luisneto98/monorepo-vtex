import { useState } from 'react';
import { Plus, Grid, List, Search } from 'lucide-react';
import { useNewsReleases } from '../hooks/useNewsReleases';
import { NewsReleaseStatus } from '@shared/types/news-releases';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { NewsGrid } from '../components/news-releases/NewsGrid';
import { NewsList } from '../components/news-releases/NewsList';
import { NewsEditor } from '../components/news-releases/NewsEditor';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function NewsReleases() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    newsReleases,
    page,
    pages,
    isLoading,
    filters,
    updateFilters,
    resetFilters,
    handlePageChange,
    deleteNewsRelease,
    publishNewsRelease,
    archiveNewsRelease,
    bulkOperation,
    isBulkOperating,
  } = useNewsReleases();

  const handleSearch = () => {
    updateFilters({ search: searchTerm });
  };

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      updateFilters({ status: undefined });
    } else {
      updateFilters({ status: status as NewsReleaseStatus });
    }
  };

  const handleEdit = (id: string) => {
    setEditingRelease(id);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingRelease(null);
  };

  const handleBulkAction = (action: 'publish' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;

    bulkOperation({
      ids: selectedIds,
      operation: action,
    });
    setSelectedIds([]);
  };

  const getStatusBadge = (status: NewsReleaseStatus) => {
    const variants: Record<NewsReleaseStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [NewsReleaseStatus.DRAFT]: 'outline',
      [NewsReleaseStatus.SCHEDULED]: 'secondary',
      [NewsReleaseStatus.PUBLISHED]: 'default',
      [NewsReleaseStatus.ARCHIVED]: 'destructive',
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">News Releases</h1>
        <Button onClick={() => setIsEditorOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Release
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex gap-2">
              <Input
                placeholder="Search news releases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={NewsReleaseStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={NewsReleaseStatus.SCHEDULED}>Scheduled</SelectItem>
                <SelectItem value={NewsReleaseStatus.PUBLISHED}>Published</SelectItem>
                <SelectItem value={NewsReleaseStatus.ARCHIVED}>Archived</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setView('grid')}
                className={view === 'grid' ? 'bg-muted' : ''}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setView('list')}
                className={view === 'list' ? 'bg-muted' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} items selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('publish')}
                disabled={isBulkOperating}
              >
                Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('archive')}
                disabled={isBulkOperating}
              >
                Archive
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
                disabled={isBulkOperating}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="min-h-[400px]">
        {newsReleases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No news releases found</p>
              <Button onClick={() => setIsEditorOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first release
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {view === 'grid' ? (
              <NewsGrid
                releases={newsReleases}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onEdit={handleEdit}
                onDelete={deleteNewsRelease}
                onPublish={publishNewsRelease}
                onArchive={archiveNewsRelease}
                getStatusBadge={getStatusBadge}
              />
            ) : (
              <NewsList
                releases={newsReleases}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onEdit={handleEdit}
                onDelete={deleteNewsRelease}
                onPublish={publishNewsRelease}
                onArchive={archiveNewsRelease}
                getStatusBadge={getStatusBadge}
              />
            )}

            {pages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {isEditorOpen && (
        <NewsEditor
          releaseId={editingRelease}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}