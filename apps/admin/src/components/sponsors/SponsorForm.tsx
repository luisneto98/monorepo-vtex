import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import type { Sponsor } from '@shared/types/sponsor.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogoUpload } from './LogoUpload';

const sponsorSchema = z.object({
  name: z.string().min(1, 'Sponsor name is required').max(100, 'Name too long'),
  tier: z.string().min(1, 'Tier selection is required'),
  logoUrl: z.string().optional(),
  description: z.object({
    'pt-BR': z.string().min(1, 'Portuguese description is required').max(500, 'Description too long'),
    'en': z.string().min(1, 'English description is required').max(500, 'Description too long'),
  }),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
  adminEmail: z.string().email('Invalid admin email'),
  contactEmail: z.string().email('Invalid contact email').optional().or(z.literal('')),
  standLocation: z.string().max(100, 'Stand location too long').optional(),
  socialLinks: z.object({
    linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
    facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  }).optional(),
  maxPosts: z.number().min(0, 'Max posts must be at least 0').max(1000, 'Max posts too high').optional(),
  isVisible: z.boolean(),
});

type SponsorFormData = z.infer<typeof sponsorSchema>;

interface SponsorFormProps {
  sponsor?: Sponsor;
  onSubmit: (data: SponsorFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  availableTiers?: Array<{ _id?: string; name: string; displayName: { 'pt-BR': string; 'en': string; }; maxPosts: number; }>;
}

export function SponsorForm({
  sponsor,
  onSubmit,
  onCancel,
  loading = false,
  availableTiers = []
}: SponsorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    mode: 'onChange',
    defaultValues: sponsor ? {
      name: sponsor.name,
      tier: typeof sponsor.tier === 'object' ? (sponsor.tier as any)._id : sponsor.tier,
      logoUrl: sponsor.logoUrl || '',
      description: sponsor.description,
      websiteUrl: sponsor.websiteUrl || '',
      adminEmail: sponsor.adminEmail,
      contactEmail: sponsor.contactEmail || '',
      standLocation: sponsor.standLocation || '',
      socialLinks: {
        linkedin: sponsor.socialLinks?.linkedin || '',
        instagram: sponsor.socialLinks?.instagram || '',
        facebook: sponsor.socialLinks?.facebook || '',
      },
      maxPosts: sponsor.maxPosts,
      isVisible: sponsor.isVisible,
    } : {
      name: '',
      tier: '',
      logoUrl: '',
      description: {
        'pt-BR': '',
        'en': '',
      },
      websiteUrl: '',
      adminEmail: '',
      contactEmail: '',
      standLocation: '',
      socialLinks: {
        linkedin: '',
        instagram: '',
        facebook: '',
      },
      maxPosts: undefined,
      isVisible: true,
    },
  });

  const formData = watch();
  const selectedTier = Array.isArray(availableTiers)
    ? availableTiers.find(tier => tier._id === formData.tier)
    : undefined;

  // Set default tier if not set and tiers are available
  useEffect(() => {
    if (!formData.tier && availableTiers.length > 0 && availableTiers[0]._id) {
      setValue('tier', availableTiers[0]._id, { shouldValidate: true });
      if (!sponsor) {
        setValue('maxPosts', availableTiers[0].maxPosts);
      }
    }
  }, [availableTiers, formData.tier, setValue, sponsor]);

  const handleTierChange = (tierId: string) => {
    setValue('tier', tierId, { shouldValidate: true });
    const tier = Array.isArray(availableTiers)
      ? availableTiers.find(t => t._id === tierId)
      : undefined;
    if (tier && !sponsor) {
      // Set default maxPosts from tier for new sponsors
      setValue('maxPosts', tier.maxPosts);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Sponsor Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., VTEX"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tier">Sponsor Tier *</Label>
            <Select
              value={formData.tier || ''}
              onValueChange={handleTierChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(availableTiers) && availableTiers.length > 0 ? (
                  availableTiers.map((tier) => (
                    <SelectItem key={tier._id || tier.name} value={tier._id || tier.name}>
                      {tier.displayName['pt-BR']} ({tier.maxPosts} posts)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-tiers" disabled>
                    No tiers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.tier && (
              <p className="text-sm text-destructive mt-1">{errors.tier.message}</p>
            )}
            {selectedTier && (
              <p className="text-xs text-muted-foreground mt-1">
                Default: {selectedTier.maxPosts} posts per tier
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="adminEmail">Admin Email *</Label>
            <Input
              id="adminEmail"
              type="email"
              {...register('adminEmail')}
              placeholder="admin@sponsor.com"
              className={errors.adminEmail ? 'border-destructive' : ''}
            />
            {errors.adminEmail && (
              <p className="text-sm text-destructive mt-1">{errors.adminEmail.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Will receive account credentials and notifications
            </p>
          </div>

          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder="contact@sponsor.com"
              className={errors.contactEmail ? 'border-destructive' : ''}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              {...register('websiteUrl')}
              placeholder="https://www.sponsor.com"
              className={errors.websiteUrl ? 'border-destructive' : ''}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-destructive mt-1">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="standLocation">Stand Location</Label>
            <Input
              id="standLocation"
              {...register('standLocation')}
              placeholder="e.g., Booth A1, Hall 2"
              className={errors.standLocation ? 'border-destructive' : ''}
            />
            {errors.standLocation && (
              <p className="text-sm text-destructive mt-1">{errors.standLocation.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <LogoUpload
            currentLogoUrl={formData.logoUrl}
            onLogoChange={(logoUrl) => setValue('logoUrl', logoUrl)}
            sponsorId={sponsor?._id}
          />

          <div>
            <Label>Description</Label>
            <Tabs defaultValue="pt-BR" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pt-BR">Português</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>

              <TabsContent value="pt-BR" className="space-y-2">
                <Textarea
                  placeholder="Descrição do patrocinador em português..."
                  {...register('description.pt-BR')}
                  className={errors.description?.['pt-BR'] ? 'border-destructive' : ''}
                  rows={4}
                />
                {errors.description?.['pt-BR'] && (
                  <p className="text-sm text-destructive">{errors.description['pt-BR'].message}</p>
                )}
              </TabsContent>

              <TabsContent value="en" className="space-y-2">
                <Textarea
                  placeholder="Sponsor description in English..."
                  {...register('description.en')}
                  className={errors.description?.['en'] ? 'border-destructive' : ''}
                  rows={4}
                />
                {errors.description?.['en'] && (
                  <p className="text-sm text-destructive">{errors.description['en'].message}</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Label>Social Links</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                <Input
                  id="linkedin"
                  type="url"
                  {...register('socialLinks.linkedin')}
                  placeholder="https://linkedin.com/company/sponsor"
                  className={errors.socialLinks?.linkedin ? 'border-destructive' : ''}
                />
                {errors.socialLinks?.linkedin && (
                  <p className="text-sm text-destructive mt-1">{errors.socialLinks.linkedin.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  {...register('socialLinks.instagram')}
                  placeholder="https://instagram.com/sponsor"
                  className={errors.socialLinks?.instagram ? 'border-destructive' : ''}
                />
                {errors.socialLinks?.instagram && (
                  <p className="text-sm text-destructive mt-1">{errors.socialLinks.instagram.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  {...register('socialLinks.facebook')}
                  placeholder="https://facebook.com/sponsor"
                  className={errors.socialLinks?.facebook ? 'border-destructive' : ''}
                />
                {errors.socialLinks?.facebook && (
                  <p className="text-sm text-destructive mt-1">{errors.socialLinks.facebook.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="maxPosts">Max Posts Override</Label>
            <Input
              id="maxPosts"
              type="number"
              min="0"
              max="1000"
              {...register('maxPosts', { valueAsNumber: true })}
              placeholder={selectedTier ? `Default: ${selectedTier.maxPosts}` : 'Enter custom limit'}
              className={errors.maxPosts ? 'border-destructive' : ''}
            />
            {errors.maxPosts && (
              <p className="text-sm text-destructive mt-1">{errors.maxPosts.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use tier default. Override for custom limits.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isVisible"
              checked={formData.isVisible}
              onCheckedChange={(checked) => setValue('isVisible', checked)}
            />
            <Label htmlFor="isVisible">Visible to public</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : sponsor ? 'Update Sponsor' : 'Create Sponsor'}
        </Button>
      </div>
    </form>
  );
}