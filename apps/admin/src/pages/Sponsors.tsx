import { useState, useEffect } from 'react';
import type { Sponsor } from '@shared/types/sponsor.types';
import { SponsorsService } from '@/services/sponsors.service';
import { SponsorsList } from '@/components/sponsors/SponsorsList';
import { SponsorDialog } from '@/components/sponsors/SponsorDialog';
import { SponsorStats } from '@/components/sponsors/SponsorStats';
import { SponsorBulkActions } from '@/components/sponsors/SponsorBulkActions';
import { SponsorDuplicate } from '@/components/sponsors/SponsorDuplicate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive } from 'lucide-react';
import { SponsorTiersService } from '@/services/sponsor-tiers.service';
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
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [sponsorToDuplicate, setSponsorToDuplicate] = useState<Sponsor | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('active');

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

  const handleDuplicate = (sponsor: Sponsor) => {
    setSponsorToDuplicate(sponsor);
    setDuplicateDialogOpen(true);
  };

  const handleBulkAction = () => {
    setSelectedSponsors([]);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDialogSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const confirmDelete = async () => {
    if (!sponsorToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      // Use soft delete instead of hard delete
      await SponsorsService.softDeleteSponsor(sponsorToDelete._id || '');
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

  useEffect(() => {
    // Fetch sponsor tiers for bulk actions
    const fetchTiers = async () => {
      try {
        const response = await SponsorTiersService.getSponsorTiers();
        // Handle nested data structure from API response
        const tiersData = response?.data || response || [];
        const tiersArray = Array.isArray(tiersData) ? tiersData : [];
        setTiers(tiersArray.map(tier => tier.name));
      } catch (err) {
        console.error('Failed to fetch tiers:', err);
      }
    };
    fetchTiers();
  }, []);

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

      <SponsorStats />

      {selectedSponsors.length > 0 && (
        <SponsorBulkActions
          selectedSponsors={selectedSponsors}
          onAction={handleBulkAction}
          tiers={tiers}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Sponsors</TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <SponsorsList
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onDuplicate={handleDuplicate}
            onSelectionChange={setSelectedSponsors}
            refreshTrigger={refreshTrigger}
            showArchived={false}
          />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <SponsorsList
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onDuplicate={handleDuplicate}
            onSelectionChange={setSelectedSponsors}
            refreshTrigger={refreshTrigger}
            showArchived={true}
          />
        </TabsContent>
      </Tabs>

      <SponsorDialog
        sponsor={selectedSponsor}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <SponsorDuplicate
        sponsor={sponsorToDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sponsor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sponsorToDelete?.name}"?
              {sponsorToDelete && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
                  <strong>Warning:</strong> This will archive the sponsor and their user account. You can recover them later from the Archived tab.
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