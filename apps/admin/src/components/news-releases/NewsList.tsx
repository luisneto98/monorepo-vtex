import { type NewsRelease, NewsReleaseStatus } from '@shared/types/news-releases';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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

interface NewsListProps {
  releases: NewsRelease[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  getStatusBadge: (status: NewsReleaseStatus) => React.ReactNode;
}

export function NewsList({
  releases,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  getStatusBadge,
}: NewsListProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelect(releases.map((r) => r._id!));
    } else {
      onSelect([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelect([...selectedIds, id]);
    } else {
      onSelect(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  releases.length > 0 &&
                  selectedIds.length === releases.length
                }
                indeterminate={
                  selectedIds.length > 0 &&
                  selectedIds.length < releases.length
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="text-center">Featured</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases.map((release) => (
            <TableRow key={release._id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(release._id!)}
                  onCheckedChange={(checked) =>
                    handleSelectItem(release._id!, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {truncateText(release.content['en'].title, 50)}
                  </p>
                  {release.content['en'].subtitle && (
                    <p className="text-sm text-muted-foreground">
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
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{release.author.name}</p>
                  <p className="text-muted-foreground">{release.author.email}</p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(release.status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {release.viewCount}
                </div>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell className="text-center">
                {release.featured && (
                  <Star className="h-4 w-4 text-yellow-500 mx-auto" />
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}