import { useState } from 'react';
import type { SponsorTier } from '@shared/types/sponsor.types';
import { SponsorTiersService } from '@/services/sponsor-tiers.service';
import { SponsorTierForm } from './SponsorTierForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SponsorTierDialogProps {
  tier?: SponsorTier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type SponsorTierFormData = {
  name: string;
  displayName: {
    'pt-BR': string;
    'en': string;
  };
  maxPosts: number;
};

export function SponsorTierDialog({ tier, open, onOpenChange, onSuccess }: SponsorTierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: SponsorTierFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (tier) {
        await SponsorTiersService.updateSponsorTier(tier._id || '', data);
      } else {
        // For new tiers, get the next order number
        const tiersResponse = await SponsorTiersService.getSponsorTiers({ sort: 'order' });
        const tiersList = Array.isArray(tiersResponse.data) ? tiersResponse.data : tiersResponse.data.data;
        const nextOrder = tiersList.length > 0
          ? Math.max(...tiersList.map((t: any) => t.order)) + 1
          : 1;

        await SponsorTiersService.createSponsorTier({
          ...data,
          order: nextOrder,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save sponsor tier:', err);
      setError(err instanceof Error ? err.message : 'Failed to save sponsor tier');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tier ? 'Edit Sponsor Tier' : 'Create New Sponsor Tier'}
          </DialogTitle>
          <DialogDescription>
            {tier
              ? 'Update the sponsor tier details below.'
              : 'Create a new sponsor tier to organize your sponsors by level or package.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        <SponsorTierForm
          tier={tier}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}