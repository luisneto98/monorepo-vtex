import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe, Linkedin, Twitter, Github, Link } from 'lucide-react';
import type { Speaker, CreateSpeakerDto, UpdateSpeakerDto } from '@shared/types/speaker.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from './ImageUpload';

const speakerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  bio: z.object({
    'pt-BR': z.string().min(10, 'Portuguese bio must be at least 10 characters'),
    'en': z.string().min(10, 'English bio must be at least 10 characters')
  }),
  company: z.string().max(100, 'Company must be less than 100 characters'),
  position: z.object({
    'pt-BR': z.string().min(1, 'Portuguese position is required'),
    'en': z.string().min(1, 'English position is required')
  }),
  photoUrl: z.string().url('Invalid photo URL'),
  socialLinks: z.object({
    linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    website: z.string().url('Invalid website URL').optional().or(z.literal(''))
  }),
  priority: z.number().min(0, 'Priority must be at least 0').max(999, 'Priority must be less than 1000'),
  isHighlight: z.boolean(),
  isVisible: z.boolean()
});

type SpeakerFormData = z.infer<typeof speakerSchema>;

interface SpeakerFormProps {
  speaker?: Speaker | null;
  onSubmit: (data: CreateSpeakerDto | UpdateSpeakerDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function SpeakerForm({ speaker, onSubmit, onCancel, loading = false }: SpeakerFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SpeakerFormData>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      name: '',
      bio: { 'pt-BR': '', 'en': '' },
      company: '',
      position: { 'pt-BR': '', 'en': '' },
      photoUrl: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        github: '',
        website: ''
      },
      priority: 0,
      isHighlight: false,
      isVisible: true
    }
  });

  useEffect(() => {
    if (speaker) {
      reset({
        name: speaker.name,
        bio: speaker.bio,
        company: speaker.company,
        position: speaker.position,
        photoUrl: speaker.photoUrl,
        socialLinks: speaker.socialLinks,
        priority: speaker.priority,
        isHighlight: speaker.isHighlight,
        isVisible: speaker.isVisible
      });
    }
  }, [speaker, reset]);

  const onFormSubmit = async (data: SpeakerFormData) => {
    // Clean up the data before submission
    const cleanedData = {
      ...data,
      socialLinks: {
        ...(data.socialLinks.linkedin && { linkedin: data.socialLinks.linkedin }),
        ...(data.socialLinks.twitter && { twitter: data.socialLinks.twitter }),
        ...(data.socialLinks.github && { github: data.socialLinks.github }),
        ...(data.socialLinks.website && { website: data.socialLinks.website }),
      }
    };

    // Remove priority field only for creation (not in CreateSpeakerDto)
    if (!speaker) {
      const { priority: _, ...createData } = cleanedData;
      await onSubmit(createData as CreateSpeakerDto);
    } else {
      // For update, priority can be sent
      await onSubmit(cleanedData as UpdateSpeakerDto);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Speaker name"
            disabled={loading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            {...register('company')}
            placeholder="Company name"
            disabled={loading}
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Position *</Label>
        <Tabs defaultValue="pt-BR" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pt-BR">
              <Globe className="w-4 h-4 mr-2" />
              Português
            </TabsTrigger>
            <TabsTrigger value="en">
              <Globe className="w-4 h-4 mr-2" />
              English
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pt-BR">
            <Input
              {...register('position.pt-BR')}
              placeholder="Cargo em português"
              disabled={loading}
            />
            {errors.position?.['pt-BR'] && (
              <p className="text-sm text-destructive mt-1">{errors.position['pt-BR'].message}</p>
            )}
          </TabsContent>
          <TabsContent value="en">
            <Input
              {...register('position.en')}
              placeholder="Position in English"
              disabled={loading}
            />
            {errors.position?.en && (
              <p className="text-sm text-destructive mt-1">{errors.position.en.message}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label>Bio *</Label>
        <Tabs defaultValue="pt-BR" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pt-BR">
              <Globe className="w-4 h-4 mr-2" />
              Português
            </TabsTrigger>
            <TabsTrigger value="en">
              <Globe className="w-4 h-4 mr-2" />
              English
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pt-BR">
            <Textarea
              {...register('bio.pt-BR')}
              placeholder="Biografia em português"
              rows={4}
              disabled={loading}
            />
            {errors.bio?.['pt-BR'] && (
              <p className="text-sm text-destructive mt-1">{errors.bio['pt-BR'].message}</p>
            )}
          </TabsContent>
          <TabsContent value="en">
            <Textarea
              {...register('bio.en')}
              placeholder="Biography in English"
              rows={4}
              disabled={loading}
            />
            {errors.bio?.en && (
              <p className="text-sm text-destructive mt-1">{errors.bio.en.message}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Controller
          name="photoUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              disabled={loading}
              speakerId={speaker?._id}
            />
          )}
        />
        {errors.photoUrl && (
          <p className="text-sm text-destructive">{errors.photoUrl.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Social Links</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-2">
            <Linkedin className="w-4 h-4 text-muted-foreground" />
            <Input
              {...register('socialLinks.linkedin')}
              placeholder="LinkedIn URL"
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Twitter className="w-4 h-4 text-muted-foreground" />
            <Input
              {...register('socialLinks.twitter')}
              placeholder="Twitter/X handle"
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Github className="w-4 h-4 text-muted-foreground" />
            <Input
              {...register('socialLinks.github')}
              placeholder="GitHub URL"
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-2 md:col-span-2">
            <Link className="w-4 h-4 text-muted-foreground" />
            <Input
              {...register('socialLinks.website')}
              placeholder="Website URL"
              disabled={loading}
            />
          </div>
        </div>
        {(errors.socialLinks?.linkedin || errors.socialLinks?.github || errors.socialLinks?.website) && (
          <p className="text-sm text-destructive">Please enter valid URLs for social links</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Input
                id="priority"
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={loading}
              />
            )}
          />
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="isHighlight"
            control={control}
            render={({ field }) => (
              <>
                <Switch
                  id="isHighlight"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                />
                <Label htmlFor="isHighlight">Highlight</Label>
              </>
            )}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="isVisible"
            control={control}
            render={({ field }) => (
              <>
                <Switch
                  id="isVisible"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                />
                <Label htmlFor="isVisible">Visible</Label>
              </>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : speaker ? 'Update Speaker' : 'Create Speaker'}
        </Button>
      </div>
    </form>
  );
}