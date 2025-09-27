import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SponsorTier } from '@shared/types/sponsor.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sponsorTierSchema = z.object({
  name: z.string().min(1, 'Technical name is required').max(50, 'Technical name too long'),
  displayName: z.object({
    'pt-BR': z.string().min(1, 'Portuguese display name is required').max(100, 'Display name too long'),
    'en': z.string().min(1, 'English display name is required').max(100, 'Display name too long'),
  }),
  maxPosts: z.number().min(0, 'Max posts must be at least 0').max(1000, 'Max posts too high'),
});

type SponsorTierFormData = z.infer<typeof sponsorTierSchema>;

interface SponsorTierFormProps {
  tier?: SponsorTier;
  onSubmit: (data: SponsorTierFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SponsorTierForm({ tier, onSubmit, onCancel, loading = false }: SponsorTierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SponsorTierFormData>({
    resolver: zodResolver(sponsorTierSchema),
    defaultValues: tier ? {
      name: tier.name,
      displayName: tier.displayName,
      maxPosts: tier.maxPosts,
    } : {
      name: '',
      displayName: {
        'pt-BR': '',
        'en': '',
      },
      maxPosts: 5,
    },
  });

  const formData = watch();

  const generateTechnicalName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleDisplayNameChange = (locale: 'pt-BR' | 'en', value: string) => {
    setValue(`displayName.${locale}`, value);

    // Auto-generate technical name from Portuguese display name
    if (locale === 'pt-BR' && !tier) {
      const technicalName = generateTechnicalName(value);
      setValue('name', technicalName);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Technical Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., gold-sponsor"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Used internally and in APIs. Auto-generated from Portuguese name.
          </p>
        </div>

        <div>
          <Label>Display Names</Label>
          <Tabs defaultValue="pt-BR" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pt-BR">Português</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>

            <TabsContent value="pt-BR" className="space-y-2">
              <Input
                placeholder="e.g., Patrocinador Ouro"
                value={formData.displayName['pt-BR']}
                onChange={(e) => handleDisplayNameChange('pt-BR', e.target.value)}
                className={errors.displayName?.['pt-BR'] ? 'border-destructive' : ''}
              />
              {errors.displayName?.['pt-BR'] && (
                <p className="text-sm text-destructive">{errors.displayName['pt-BR'].message}</p>
              )}
            </TabsContent>

            <TabsContent value="en" className="space-y-2">
              <Input
                placeholder="e.g., Gold Sponsor"
                value={formData.displayName['en']}
                onChange={(e) => handleDisplayNameChange('en', e.target.value)}
                className={errors.displayName?.['en'] ? 'border-destructive' : ''}
              />
              {errors.displayName?.['en'] && (
                <p className="text-sm text-destructive">{errors.displayName['en'].message}</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Label htmlFor="maxPosts">Default Max Posts</Label>
          <Input
            id="maxPosts"
            type="number"
            min="0"
            max="1000"
            {...register('maxPosts', { valueAsNumber: true })}
            className={errors.maxPosts ? 'border-destructive' : ''}
          />
          {errors.maxPosts && (
            <p className="text-sm text-destructive mt-1">{errors.maxPosts.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Default number of posts sponsors in this tier can create. Can be overridden per sponsor.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : tier ? 'Update Tier' : 'Create Tier'}
        </Button>
      </div>
    </form>
  );
}