import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import newsReleasesService from '../../services/news-releases.service';
import {
  type CreateNewsReleaseDto,
  type UpdateNewsReleaseDto,
  NewsReleaseStatus,
  type LocalizedNewsContent,
} from '@shared/types/news-releases';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { ImageGalleryManager } from './ImageGalleryManager';

interface NewsEditorProps {
  releaseId?: string | null;
  onClose: () => void;
}

export function NewsEditor({ releaseId, onClose }: NewsEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pt-BR');
  const [formData, setFormData] = useState<CreateNewsReleaseDto>({
    content: {
      'pt-BR': { title: '', content: '' },
      'en': { title: '', content: '' },
      'es': { title: '', content: '' },
    },
    status: NewsReleaseStatus.DRAFT,
    featured: false,
    categories: [],
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const { data: release, isLoading: isLoadingRelease } = useQuery({
    queryKey: ['newsRelease', releaseId],
    queryFn: () => newsReleasesService.getNewsRelease(releaseId!),
    enabled: !!releaseId,
  });

  useEffect(() => {
    if (release) {
      setFormData({
        content: release.content,
        status: release.status,
        featured: release.featured,
        featuredImage: release.featuredImage,
        categories: release.categories || [],
        tags: release.tags || [],
        scheduledFor: release.scheduledFor ? new Date(release.scheduledFor) : undefined,
        relatedArticles: release.relatedArticles,
      });
    }
  }, [release]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateNewsReleaseDto) =>
      newsReleasesService.createNewsRelease(dto),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'News release created successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      const errorData = error.response?.data?.error || error.response?.data;
      const messages = errorData?.message;
      const description = Array.isArray(messages)
        ? messages.join(', ')
        : messages || 'Failed to create news release';

      toast({
        title: 'Validation Error',
        description,
        variant: 'destructive',
        duration: 8000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateNewsReleaseDto) =>
      newsReleasesService.updateNewsRelease(releaseId!, dto),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'News release updated successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      const errorData = error.response?.data?.error || error.response?.data;
      const messages = errorData?.message;
      const description = Array.isArray(messages)
        ? messages.join(', ')
        : messages || 'Failed to update news release';

      toast({
        title: 'Validation Error',
        description,
        variant: 'destructive',
        duration: 8000,
      });
    },
  });

  const handleSave = () => {
    const validationErrors: string[] = [];

    ['pt-BR', 'en', 'es'].forEach((lang) => {
      const content = formData.content[lang as keyof typeof formData.content];
      const langName = lang === 'pt-BR' ? 'Portuguese' : lang === 'en' ? 'English' : 'Spanish';

      if (!content.title.trim() || content.title.trim().length < 3) {
        validationErrors.push(`${langName}: Title must be at least 3 characters`);
      }

      if (!content.content.trim() || content.content.trim().length < 10) {
        validationErrors.push(`${langName}: Content must be at least 10 characters`);
      }
    });

    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join('. '),
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    if (releaseId) {
      updateMutation.mutate(formData as UpdateNewsReleaseDto);
    } else {
      createMutation.mutate(formData);
    }
  };

  const updateContent = (
    language: 'pt-BR' | 'en' | 'es',
    field: keyof LocalizedNewsContent,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [language]: {
          ...prev.content[language],
          [field]: value,
        },
      },
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim().toLowerCase()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories?.includes(newCategory.trim())) {
      setFormData((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory.trim()],
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories?.filter((c) => c !== category),
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingRelease;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {releaseId ? 'Edit News Release' : 'Create News Release'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: NewsReleaseStatus) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NewsReleaseStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={NewsReleaseStatus.SCHEDULED}>Scheduled</SelectItem>
                  <SelectItem value={NewsReleaseStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem value={NewsReleaseStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === NewsReleaseStatus.SCHEDULED && (
              <div className="space-y-2">
                <Label>Schedule Publication</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.scheduledFor && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduledFor
                        ? format(formData.scheduledFor, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledFor}
                      onSelect={(date?: Date) =>
                        setFormData((prev) => ({ ...prev, scheduledFor: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, featured: checked }))
              }
            />
            <Label htmlFor="featured">Featured Article</Label>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="pt-BR">Português</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
            </TabsList>

            {(['pt-BR', 'en', 'es'] as const).map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.content[lang].title}
                    onChange={(e) => updateContent(lang, 'title', e.target.value)}
                    placeholder={`Enter title in ${lang}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={formData.content[lang].subtitle || ''}
                    onChange={(e) => updateContent(lang, 'subtitle', e.target.value)}
                    placeholder={`Enter subtitle in ${lang}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content[lang].content}
                    onChange={(e) => updateContent(lang, 'content', e.target.value)}
                    placeholder={`Enter content in ${lang}`}
                    rows={10}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    HTML content is supported and will be sanitized
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta Title</Label>
                    <Input
                      value={formData.content[lang].metaTitle || ''}
                      onChange={(e) => updateContent(lang, 'metaTitle', e.target.value)}
                      placeholder="SEO meta title"
                      maxLength={70}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={formData.content[lang].metaDescription || ''}
                      onChange={(e) =>
                        updateContent(lang, 'metaDescription', e.target.value)
                      }
                      placeholder="SEO meta description"
                      maxLength={160}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <Input
                    value={formData.content[lang].keywords?.join(', ') || ''}
                    onChange={(e) =>
                      updateContent(
                        lang,
                        'keywords',
                        e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                      )
                    }
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add category"
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <Button type="button" onClick={addCategory} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.categories?.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                    <button
                      onClick={() => removeCategory(category)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {releaseId && release && (
            <ImageGalleryManager
              releaseId={releaseId}
              images={release.images || []}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {releaseId ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}