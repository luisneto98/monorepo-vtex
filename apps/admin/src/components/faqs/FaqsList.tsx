import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  Languages,
  ArrowUpDown,
} from 'lucide-react';
import type { Faq, FaqCategory } from '@shared/types/faq.types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface FaqsListProps {
  faqs: Faq[];
  categories: FaqCategory[];
  loading: boolean;
  onEdit: (faq: Faq) => void;
  onDelete: (id: string) => void;
  onOrderChange: (faqs: Faq[]) => void;
  onToggleVisibility: (faq: Faq) => void;
  onView: (id: string) => void;
}

interface SortableItemProps {
  faq: Faq;
  category?: FaqCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onView: () => void;
}

function SortableItem({
  faq,
  category,
  onEdit,
  onDelete,
  onToggleVisibility,
  onView,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq._id || '' });

  const style = {
    transform: CSS.Transform.toString(transform || null),
    transition,
  };

  const hasTranslation = (faq: Faq) => {
    const ptComplete = faq.question['pt-BR'] && faq.answer['pt-BR'];
    const enComplete = faq.question['en'] && faq.answer['en'];
    return { pt: ptComplete, en: enComplete };
  };

  const translation = hasTranslation(faq);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-4 transition-opacity',
        isDragging && 'opacity-50',
        !faq.isVisible && 'opacity-60'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-medium">
                {faq.question['pt-BR'] || faq.question['en']}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">
                  {category?.name['pt-BR'] || 'Uncategorized'}
                </Badge>
                <Badge variant={faq.isVisible ? 'default' : 'secondary'}>
                  {faq.isVisible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  {faq.isVisible ? 'Visible' : 'Hidden'}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" />
                  {faq.viewCount || 0}
                </Badge>
                {translation.pt && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    PT
                  </Badge>
                )}
                {translation.en && (
                  <Badge variant="outline" className="gap-1">
                    <Languages className="h-3 w-3" />
                    EN
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={faq.isVisible}
              onCheckedChange={onToggleVisibility}
              aria-label="Toggle visibility"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onView(); onEdit(); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-sm text-muted-foreground line-clamp-2"
          dangerouslySetInnerHTML={{
            __html: faq.answer['pt-BR'] || faq.answer['en'] || ''
          }}
        />
      </CardContent>
    </Card>
  );
}

export function FaqsList({
  faqs,
  categories,
  loading,
  onEdit,
  onDelete,
  onOrderChange,
  onToggleVisibility,
  onView,
}: FaqsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'order' | 'views' | 'category'>('order');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex((faq) => faq._id === active.id);
      const newIndex = faqs.findIndex((faq) => faq._id === over.id);

      const newFaqs = arrayMove(faqs, oldIndex, newIndex).map(
        (faq, index) => ({ ...faq, order: index })
      );

      onOrderChange(newFaqs);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const sortedFaqs = [...faqs].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return (b.viewCount || 0) - (a.viewCount || 0);
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      default:
        return a.order - b.order;
    }
  });

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat._id === id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No FAQs found. Create your first FAQ to get started.
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'order' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('order')}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Order
          </Button>
          <Button
            variant={sortBy === 'views' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('views')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Views
          </Button>
          <Button
            variant={sortBy === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('category')}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Category
          </Button>
        </div>
      </div>

      {sortBy === 'order' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedFaqs.map(faq => faq._id).filter((id): id is string => !!id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedFaqs.map((faq) => (
              <SortableItem
                key={faq._id}
                faq={faq}
                category={getCategoryById(faq.category)}
                onEdit={() => onEdit(faq)}
                onDelete={() => faq._id && setDeleteId(faq._id)}
                onToggleVisibility={() => onToggleVisibility(faq)}
                onView={() => faq._id && onView(faq._id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-4">
          {sortedFaqs.map((faq) => (
            <SortableItem
              key={faq._id}
              faq={faq}
              category={getCategoryById(faq.category)}
              onEdit={() => onEdit(faq)}
              onDelete={() => faq._id && setDeleteId(faq._id)}
              onToggleVisibility={() => onToggleVisibility(faq)}
              onView={() => faq._id && onView(faq._id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the FAQ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}