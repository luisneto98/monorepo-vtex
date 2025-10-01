import { useState, useEffect } from 'react';
import type { Sponsor, SponsorTier } from '@shared/types/sponsor.types';
import { SponsorsService } from '@/services/sponsors.service';
import { SponsorTiersService } from '@/services/sponsor-tiers.service';
import { SponsorForm } from './SponsorForm';
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
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTiers, setAvailableTiers] = useState<SponsorTier[]>([]);

  useEffect(() => {
    if (open) {
      fetchTiers();
    }
  }, [open]);

  const fetchTiers = async () => {
    try {
      setLoadingTiers(true);
      const response = await SponsorTiersService.getSponsorTiers({ sort: 'order' });
      // Handle nested data structure from API response: { data: { data: [...] } }
      let tiersArray = [];
      if (response?.data) {
        // Check if data is nested (data.data) or direct array
        if (Array.isArray(response.data)) {
          tiersArray = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          tiersArray = response.data.data;
        }
      }
      setAvailableTiers(tiersArray);
    } catch (err) {
      console.error('Failed to fetch sponsor tiers:', err);
      setError('Failed to load sponsor tiers');
    } finally {
      setLoadingTiers(false);
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
        // For updates, send only the modified fields
        await SponsorsService.updateSponsor(sponsor._id || '', cleanedData);
      } else {
        // For new sponsors, generate slug and set order
        const sponsorsInTier = await SponsorsService.getSponsorsByTier(data.tier);
        const nextOrder = sponsorsInTier.data.length > 0
          ? Math.max(...sponsorsInTier.data.map(s => s.orderInTier)) + 1
          : 1;

        // Build payload without postsUsed and with proper URL handling
        const payload: any = {
          name: cleanedData.name,
          tier: cleanedData.tier,
          description: cleanedData.description,
          adminEmail: cleanedData.adminEmail,
          isVisible: cleanedData.isVisible,
          slug: generateSlug(data.name),
          orderInTier: nextOrder,
          tags: [],
        };

        // Only add optional fields if they have valid values
        if (cleanedData.logoUrl && cleanedData.logoUrl.startsWith('http')) {
          payload.logoUrl = cleanedData.logoUrl;
        }
        if (cleanedData.websiteUrl && cleanedData.websiteUrl.startsWith('http')) {
          payload.websiteUrl = cleanedData.websiteUrl;
        }
        if (cleanedData.contactEmail) {
          payload.contactEmail = cleanedData.contactEmail;
        }
        if (cleanedData.standLocation) {
          payload.standLocation = cleanedData.standLocation;
        }
        if (cleanedData.maxPosts) {
          payload.maxPosts = cleanedData.maxPosts;
        }
        if (cleanedData.socialLinks && Object.keys(cleanedData.socialLinks).length > 0) {
          payload.socialLinks = cleanedData.socialLinks;
        }

        await SponsorsService.createSponsor(payload);
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <svg
                    className="h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Em breve</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  A gestão de contas de usuário para patrocinadores estará disponível em breve.
                </p>
              </div>
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