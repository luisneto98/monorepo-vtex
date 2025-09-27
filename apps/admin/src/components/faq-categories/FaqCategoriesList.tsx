import { useState } from 'react';
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
import { Edit, Trash2, MoreHorizontal, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import type { FaqCategory } from '@shared/types/faq.types';
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

interface FaqCategoriesListProps {
  categories: FaqCategory[];
  loading: boolean;
  onEdit: (category: FaqCategory) => void;
  onDelete: (id: string) => void;
  onOrderChange: (categories: FaqCategory[]) => void;
}

interface SortableRowProps {
  category: FaqCategory;
  faqCount: number;
  onEdit: (category: FaqCategory) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SortableRow({
  category,
  faqCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id || '' });

  const style = {
    transform: CSS.Transform.toString(transform || null),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{category.name['pt-BR']}</TableCell>
      <TableCell>{category.name['en']}</TableCell>
      <TableCell>
        <Badge variant="secondary">{faqCount} FAQs</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function FaqCategoriesList({
  categories,
  loading,
  onEdit,
  onDelete,
  onOrderChange,
}: FaqCategoriesListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat._id === active.id);
      const newIndex = categories.findIndex((cat) => cat._id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex).map(
        (cat, index) => ({ ...cat, order: index })
      );

      onOrderChange(newCategories);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newCategories = arrayMove(categories, index, index - 1).map(
        (cat, idx) => ({ ...cat, order: idx })
      );
      onOrderChange(newCategories);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < categories.length - 1) {
      const newCategories = arrayMove(categories, index, index + 1).map(
        (cat, idx) => ({ ...cat, order: idx })
      );
      onOrderChange(newCategories);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Ensure categories is always an array
  const categoriesArray = Array.isArray(categories) ? categories : [];

  if (categoriesArray.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No FAQ categories found. Create your first category to get started.
      </div>
    );
  }

  const sortedCategories = [...categoriesArray].sort((a, b) => a.order - b.order);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name (PT-BR)</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>FAQ Count</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={sortedCategories.map(cat => cat._id).filter((id): id is string => !!id)}
                strategy={verticalListSortingStrategy}
              >
                {sortedCategories.map((category, index) => (
                  <SortableRow
                    key={category._id}
                    category={category}
                    faqCount={category.faqCount || 0}
                    onEdit={onEdit}
                    onDelete={() => category._id && setDeleteId(category._id)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedCategories.length - 1}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </div>
      </DndContext>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the FAQ category.
              If this category has associated FAQs, the deletion will fail.
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