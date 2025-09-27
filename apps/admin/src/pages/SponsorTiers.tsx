import { useState } from 'react';
import type { SponsorTier } from '@shared/types/sponsor.types';
import { SponsorTiersService } from '@/services/sponsor-tiers.service';
import { SponsorTiersList } from '@/components/sponsor-tiers/SponsorTiersList';
import { SponsorTierDialog } from '@/components/sponsor-tiers/SponsorTierDialog';
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

export function SponsorTiers() {
  const [selectedTier, setSelectedTier] = useState<SponsorTier | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<SponsorTier | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAdd = () => {
    setSelectedTier(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (tier: SponsorTier) => {
    setSelectedTier(tier);
    setDialogOpen(true);
  };

  const handleDelete = (tier: SponsorTier) => {
    setTierToDelete(tier);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!tierToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      await SponsorTiersService.deleteSponsorTier(tierToDelete._id || '');
      setRefreshTrigger(prev => prev + 1);
      setDeleteDialogOpen(false);
      setTierToDelete(undefined);
    } catch (err) {
      console.error('Failed to delete sponsor tier:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete sponsor tier');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setTierToDelete(undefined);
    setDeleteError(null);
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sponsor Tiers</h1>
          <p className="text-muted-foreground">
            Manage sponsor tier hierarchy and organize sponsors by sponsorship level.
          </p>
        </div>

        <SponsorTiersList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          refreshTrigger={refreshTrigger}
        />

        <SponsorTierDialog
          tier={selectedTier}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleDialogSuccess}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sponsor Tier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the tier "{tierToDelete?.displayName['pt-BR']}"?
                {tierToDelete && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
                    <strong>Warning:</strong> This action cannot be undone. All sponsors in this tier will need to be reassigned to other tiers.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                {deleteError}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete} disabled={deleteLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Tier'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}