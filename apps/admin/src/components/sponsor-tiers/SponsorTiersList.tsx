import { useState, useEffect, useCallback } from 'react';
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
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import type { SponsorTier } from '@shared/types/sponsor.types';
import { SponsorTiersService } from '@/services/sponsor-tiers.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SponsorTiersListProps {
  onEdit: (tier: SponsorTier) => void;
  onDelete: (tier: SponsorTier) => void;
  onAdd: () => void;
  refreshTrigger?: number;
}

interface SortableRowProps {
  tier: SponsorTier;
  onEdit: (tier: SponsorTier) => void;
  onDelete: (tier: SponsorTier) => void;
}

function SortableRow({ tier, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: tier._id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="w-[50px]">
        <div {...listeners} className="cursor-grab hover:cursor-grabbing p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="w-[60px] text-center font-medium">
        <Badge variant="outline">{tier.order}</Badge>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{tier.displayName['pt-BR']}</div>
          <div className="text-sm text-muted-foreground">{tier.displayName['en']}</div>
        </div>
      </TableCell>
      <TableCell>
        <code className="text-sm bg-muted px-2 py-1 rounded">{tier.name}</code>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary">{tier.maxPosts}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(tier)}
            aria-label={`Edit ${tier.displayName['pt-BR']}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(tier)}
            aria-label={`Delete ${tier.displayName['pt-BR']}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SponsorTiersList({ onEdit, onDelete, onAdd, refreshTrigger }: SponsorTiersListProps) {
  const [tiers, setTiers] = useState<SponsorTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await SponsorTiersService.getSponsorTiers({ sort: 'order' });
      // Handle nested data structure from API response
      const tiersData = response?.data?.data || response?.data || response || [];
      setTiers(Array.isArray(tiersData) ? tiersData : []);
    } catch (err) {
      setError('Failed to load sponsor tiers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers, refreshTrigger]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tiers.findIndex((tier) => tier._id === active.id);
    const newIndex = tiers.findIndex((tier) => tier._id === over.id);

    const newTiers = arrayMove(tiers, oldIndex, newIndex);

    // Update order numbers
    const updatedTiers = newTiers.map((tier, index) => ({
      ...tier,
      order: index + 1,
    }));

    setTiers(updatedTiers);
    setReordering(true);

    try {
      // Send reorder request to API
      const tierIds = updatedTiers.map(tier => tier._id || '').filter(id => id);
      await SponsorTiersService.reorderTiers(tierIds);
    } catch (err) {
      console.error('Failed to reorder tiers:', err);
      setError('Failed to reorder tiers');
      // Revert to original order on error
      fetchTiers();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Sponsor Tiers</h2>
          <p className="text-sm text-muted-foreground">
            Manage sponsor tier hierarchy and ordering
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {reordering && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          Updating tier order...
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[60px] text-center">Order</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Technical Name</TableHead>
              <TableHead className="text-center">Max Posts</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tiers.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={tiers.map(tier => tier._id || '').filter(id => id)} strategy={verticalListSortingStrategy}>
                  {tiers.map((tier) => (
                    <SortableRow
                      key={tier._id}
                      tier={tier}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No sponsor tiers found. Create your first tier to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Drag and drop tiers to reorder them. Order determines sponsor display priority.
      </div>
    </div>
  );
}