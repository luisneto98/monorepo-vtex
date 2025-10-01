import { useState } from 'react';
import type { Sponsor } from '@shared/types/sponsor.types';
import { SponsorsService } from '@/services/sponsors.service';
import { SponsorsList } from '@/components/sponsors/SponsorsList';
import { SponsorDialog } from '@/components/sponsors/SponsorDialog';
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

export function Sponsors() {
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAdd = () => {
    setSelectedSponsor(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setDialogOpen(true);
  };

  const handleDelete = (sponsor: Sponsor) => {
    setSponsorToDelete(sponsor);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!sponsorToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      await SponsorsService.deleteSponsor(sponsorToDelete._id || '');
      setRefreshTrigger(prev => prev + 1);
      setDeleteDialogOpen(false);
      setSponsorToDelete(undefined);
    } catch (err) {
      console.error('Failed to delete sponsor:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete sponsor');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSponsorToDelete(undefined);
    setDeleteError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sponsors</h1>
        <p className="text-muted-foreground">
          Manage event sponsors, their information, and content permissions.
        </p>
      </div>

      <SponsorsList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        refreshTrigger={refreshTrigger}
      />

      <SponsorDialog
        sponsor={selectedSponsor}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sponsor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{sponsorToDelete?.name}"?
              {sponsorToDelete && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The sponsor and all associated data will be permanently deleted.
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
              {deleteLoading ? 'Deleting...' : 'Delete Sponsor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}