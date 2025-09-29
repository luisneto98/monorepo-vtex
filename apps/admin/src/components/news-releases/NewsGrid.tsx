import { type NewsRelease, NewsReleaseStatus } from '@shared/types/news-releases';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
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
  Calendar,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

interface NewsGridProps {
  releases: NewsRelease[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  getStatusBadge: (status: NewsReleaseStatus) => React.ReactNode;
}

export function NewsGrid({
  releases,
  selectedIds,
  onSelect,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  getStatusBadge,
}: NewsGridProps) {
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

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {releases.map((release) => (
        <Card key={release._id} className="relative hover:shadow-lg transition-shadow">
          <div className="absolute top-4 left-4 z-10">
            <Checkbox
              checked={selectedIds.includes(release._id!)}
              onCheckedChange={(checked) =>
                handleSelectItem(release._id!, checked as boolean)
              }
            />
          </div>

          <CardHeader className="pr-12">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {release.content['en'].title}
                </h3>
                {release.content['en'].subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {truncateText(release.content['en'].subtitle, 60)}
                  </p>
                )}
              </div>
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
            </div>
          </CardHeader>

          <CardContent>
            {release.featuredImage && (
              <img
                src={release.featuredImage}
                alt={release.content['en'].title}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
            )}
            <p className="text-sm text-muted-foreground line-clamp-3">
              {truncateText(stripHtml(release.content['en'].content), 150)}
            </p>

            <div className="mt-3 flex flex-wrap gap-1">
              {release.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 text-xs bg-muted rounded"
                >
                  {tag}
                </span>
              ))}
              {release.tags && release.tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs text-muted-foreground">
                  +{release.tags.length - 3} more
                </span>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {release.viewCount}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(release.createdAt), 'MMM d')}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {release.author.name.split(' ')[0]}
              </div>
            </div>
            {getStatusBadge(release.status)}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}