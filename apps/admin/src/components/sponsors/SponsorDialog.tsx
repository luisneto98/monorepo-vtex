import { useState, useEffect } from 'react';
import type { Sponsor, SponsorTier } from '@shared/types/sponsor.types';
import { SponsorsService } from '@/services/sponsors.service';
import { SponsorTiersService } from '@/services/sponsor-tiers.service';
import { SponsorForm } from './SponsorForm';
import { UserAccountManager } from './UserAccountManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SponsorDialogProps {
  sponsor?: Sponsor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type SponsorFormData = {
  name: string;
  tier: string;
  logoUrl?: string;
  description: {
    'pt-BR': string;
    'en': string;
  };
  websiteUrl?: string;
  adminEmail: string;
  contactEmail?: string;
  standLocation?: string;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  maxPosts?: number;
  isVisible: boolean;
};

export function SponsorDialog({ sponsor, open, onOpenChange, onSuccess }: SponsorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTiers, setAvailableTiers] = useState<SponsorTier[]>([]);

  useEffect(() => {
    if (open) {
      fetchTiers();
    }
  }, [open]);

  const fetchTiers = async () => {
    try {
      const response = await SponsorTiersService.getSponsorTiers({ sort: 'order' });
      console.log('Raw API response:', response);

      // Handle nested data structure from API response
      const tiersData = response?.data || response || [];
      console.log('Extracted tiers data:', tiersData);

      setAvailableTiers(Array.isArray(tiersData) ? tiersData : []);
    } catch (err) {
      console.error('Failed to fetch sponsor tiers:', err);
      setError('Failed to load sponsor tiers');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async (data: SponsorFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Clean up empty optional fields
      const cleanedData = {
        ...data,
        logoUrl: data.logoUrl || '',
        websiteUrl: data.websiteUrl || undefined,
        contactEmail: data.contactEmail || undefined,
        standLocation: data.standLocation || undefined,
        socialLinks: {
          linkedin: data.socialLinks?.linkedin || undefined,
          instagram: data.socialLinks?.instagram || undefined,
          facebook: data.socialLinks?.facebook || undefined,
        },
        maxPosts: data.maxPosts || undefined,
      };

      if (sponsor) {
        await SponsorsService.updateSponsor(sponsor._id || '', cleanedData);
      } else {
        // For new sponsors, generate slug and set order
        const sponsorsInTier = await SponsorsService.getSponsorsByTier(data.tier);
        const nextOrder = sponsorsInTier.data.length > 0
          ? Math.max(...sponsorsInTier.data.map(s => s.orderInTier)) + 1
          : 1;

        await SponsorsService.createSponsor({
          name: cleanedData.name,
          tier: cleanedData.tier,
          logoUrl: cleanedData.logoUrl,
          description: cleanedData.description,
          websiteUrl: cleanedData.websiteUrl || '',
          adminEmail: cleanedData.adminEmail,
          contactEmail: cleanedData.contactEmail || '',
          standLocation: cleanedData.standLocation || '',
          socialLinks: cleanedData.socialLinks,
          maxPosts: cleanedData.maxPosts,
          isVisible: cleanedData.isVisible,
          slug: generateSlug(data.name),
          orderInTier: nextOrder,
          postsUsed: 0,
          tags: [],
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save sponsor:', err);
      setError(err instanceof Error ? err.message : 'Failed to save sponsor');
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sponsor ? 'Edit Sponsor' : 'Create New Sponsor'}
          </DialogTitle>
          <DialogDescription>
            {sponsor
              ? 'Update the sponsor details below.'
              : 'Add a new sponsor to the event. They will automatically receive login credentials.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        )}

        {sponsor ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Sponsor Details</TabsTrigger>
              <TabsTrigger value="account">User Account</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <SponsorForm
                sponsor={sponsor}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                availableTiers={availableTiers}
              />
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <UserAccountManager sponsor={sponsor} />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <SponsorForm
            sponsor={sponsor}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            availableTiers={availableTiers}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}