import { useCallback, useRef, useEffect, memo } from 'react';
// @ts-ignore
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { type NewsRelease, NewsReleaseStatus } from '@shared/types/news-releases';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  MoreVertical,
  Edit,
  Trash,
  Send,
  Archive,
  Eye,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';

interface NewsListVirtualizedProps {
  releases: NewsRelease[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  getStatusBadge: (status: NewsReleaseStatus) => React.ReactNode;
}

const ITEM_HEIGHT = 80; // Height of each row in pixels

export function NewsListVirtualized({
  releases,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  getStatusBadge,
}: NewsListVirtualizedProps) {
  const listRef = useRef<any>(null);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        onSelect(releases.map((r) => r._id!));
      } else {
        onSelect([]);
      }
    },
    [releases, onSelect]
  );

  const handleSelectItem = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        onSelect([...selectedIds, id]);
      } else {
        onSelect(selectedIds.filter((selectedId) => selectedId !== id));
      }
    },
    [selectedIds, onSelect]
  );

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Row renderer for virtual scrolling
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const release = releases[index];

    if (!release) return null;

    return (
      <div
        style={style}
        className="flex items-center border-b hover:bg-muted/50 transition-colors px-4"
      >
        {/* Checkbox */}
        <div className="w-12 flex-shrink-0">
          <Checkbox
            checked={selectedIds.includes(release._id!)}
            onCheckedChange={(checked) =>
              handleSelectItem(release._id!, checked as boolean)
            }
            aria-label={`Select ${release.content['en'].title}`}
          />
        </div>

        {/* Title and Tags */}
        <div className="flex-1 min-w-0 px-3">
          <p className="font-medium truncate">
            {truncateText(release.content['en'].title, 50)}
          </p>
          {release.content['en'].subtitle && (
            <p className="text-sm text-muted-foreground truncate">
              {truncateText(release.content['en'].subtitle, 60)}
            </p>
          )}
          {release.tags && release.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {release.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 text-xs bg-muted rounded"
                >
                  {tag}
                </span>
              ))}
              {release.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{release.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Author */}
        <div className="w-40 flex-shrink-0 px-3">
          <p className="text-sm truncate">{release.author.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {release.author.email}
          </p>
        </div>

        {/* Status */}
        <div className="w-28 flex-shrink-0 px-3">
          {getStatusBadge(release.status)}
        </div>

        {/* Views */}
        <div className="w-20 flex-shrink-0 px-3">
          <div className="flex items-center gap-1 text-sm">
            <Eye className="h-3 w-3" />
            {release.viewCount || 0}
          </div>
        </div>

        {/* Published Date */}
        <div className="w-32 flex-shrink-0 px-3">
          {release.publishedAt ? (
            <div>
              <p className="text-sm">
                {format(new Date(release.publishedAt), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(release.publishedAt), 'h:mm a')}
              </p>
            </div>
          ) : release.scheduledFor ? (
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-xs">
                {format(new Date(release.scheduledFor), 'MMM d, h:mm a')}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        {/* Featured */}
        <div className="w-16 flex-shrink-0 text-center px-3">
          {release.featured && (
            <Star className="h-4 w-4 text-yellow-500 mx-auto" />
          )}
        </div>

        {/* Actions */}
        <div className="w-12 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(release._id!)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {release.status === NewsReleaseStatus.DRAFT && (
                <DropdownMenuItem onClick={() => onPublish(release._id!)}>
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}
              {release.status === NewsReleaseStatus.PUBLISHED && (
                <DropdownMenuItem onClick={() => onArchive(release._id!)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(release._id!)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Scroll to top when releases change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0, 'start');
    }
  }, [releases]);

  return (
    <div className="border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center border-b bg-muted/30 px-4 h-12 sticky top-0 z-10">
        <div className="w-12 flex-shrink-0">
          <Checkbox
            checked={
              releases.length > 0 && selectedIds.length === releases.length
            }
            indeterminate={
              selectedIds.length > 0 && selectedIds.length < releases.length
            }
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </div>
        <div className="flex-1 px-3 text-sm font-medium">Title</div>
        <div className="w-40 flex-shrink-0 px-3 text-sm font-medium">Author</div>
        <div className="w-28 flex-shrink-0 px-3 text-sm font-medium">Status</div>
        <div className="w-20 flex-shrink-0 px-3 text-sm font-medium">Views</div>
        <div className="w-32 flex-shrink-0 px-3 text-sm font-medium">Published</div>
        <div className="w-16 flex-shrink-0 px-3 text-sm font-medium text-center">
          Featured
        </div>
        <div className="w-12 flex-shrink-0"></div>
      </div>

      {/* Virtual List */}
      <div style={{ height: 'calc(100vh - 300px)' }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              ref={listRef}
              height={height}
              itemCount={releases.length}
              itemSize={ITEM_HEIGHT}
              width={width}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            >
              {Row}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>

      {/* Footer with count */}
      <div className="border-t px-4 py-2 text-sm text-muted-foreground">
        {releases.length === 0 ? (
          <span>No news releases found</span>
        ) : (
          <span>
            Showing {releases.length} news release{releases.length !== 1 ? 's' : ''}
            {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
          </span>
        )}
      </div>
    </div>
  );
}

// Memoized version for performance

export const NewsListVirtualizedMemo = memo(NewsListVirtualized, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.releases === nextProps.releases &&
    prevProps.selectedIds === nextProps.selectedIds &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onPublish === nextProps.onPublish &&
    prevProps.onArchive === nextProps.onArchive &&
    prevProps.getStatusBadge === nextProps.getStatusBadge
  );
});