import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from './RichTextEditor';
import { TranslationStatus } from './TranslationStatus';
import { Globe, Languages, AlertCircle } from 'lucide-react';
import type { Faq, FaqCategory } from '@shared/types/faq.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DOMPurify from 'dompurify';

const faqSchema = z.object({
  question: z.object({
    'pt-BR': z.string().min(1, 'Question in Portuguese is required'),
    'en': z.string().optional(),
  }),
  answer: z.object({
    'pt-BR': z.string().min(1, 'Answer in Portuguese is required'),
    'en': z.string().optional(),
  }),
  category: z.string().min(1, 'Category is required'),
  isVisible: z.boolean(),
});

type FaqFormData = z.infer<typeof faqSchema>;

interface FaqDialogProps {
  faq: Faq | null;
  categories: FaqCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Faq>) => Promise<void>;
}

export function FaqDialog({
  faq,
  categories,
  open,
  onOpenChange,
  onSave,
}: FaqDialogProps) {
  const [activeTab, setActiveTab] = useState('pt-BR');
  const [saving, setSaving] = useState(false);

  const form = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: {
        'pt-BR': '',
        'en': '',
      },
      answer: {
        'pt-BR': '',
        'en': '',
      },
      category: '',
      isVisible: true,
    },
  });

  useEffect(() => {
    if (faq) {
      // Extract category ID if it's a populated object
      const categoryId = typeof faq.category === 'string'
        ? faq.category
        : (faq.category as any)?._id || '';

      form.reset({
        question: faq.question,
        answer: faq.answer,
        category: categoryId,
        isVisible: faq.isVisible,
      });
    } else {
      form.reset({
        question: {
          'pt-BR': '',
          'en': '',
        },
        answer: {
          'pt-BR': '',
          'en': '',
        },
        category: categories[0]?._id || '',
        isVisible: true,
      });
    }
  }, [faq, categories, form]);

  const handleSubmit = async (data: FaqFormData) => {
    try {
      setSaving(true);

      // Sanitize HTML content
      const sanitizedData = {
        ...data,
        question: {
          'pt-BR': data.question['pt-BR'],
          'en': data.question['en'] || '',
        },
        answer: {
          'pt-BR': DOMPurify.sanitize(data.answer['pt-BR']),
          'en': DOMPurify.sanitize(data.answer['en'] || ''),
        },
      };

      await onSave(sanitizedData);
      form.reset();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyFromLanguage = (fromLang: 'pt-BR' | 'en', toLang: 'pt-BR' | 'en') => {
    const currentValues = form.getValues();
    form.setValue(`question.${toLang}` as any, currentValues.question[fromLang] || '');
    form.setValue(`answer.${toLang}` as any, currentValues.answer[fromLang] || '');
  };

  const hasTranslation = () => {
    const values = form.watch();
    return {
      'pt-BR': !!values.question['pt-BR'] && !!values.answer['pt-BR'],
      'en': !!values.question['en'] && !!values.answer['en'],
    };
  };

  const translation = hasTranslation();
  const answerSize = {
    'pt-BR': new Blob([form.watch('answer.pt-BR') || '']).size,
    'en': new Blob([form.watch('answer.en') || '']).size,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {faq ? 'Edit FAQ' : 'Create FAQ'}
          </DialogTitle>
          <DialogDescription>
            Create frequently asked questions with rich text answers in multiple languages.
          </DialogDescription>
        </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id || ''}>
                            {category.name['pt-BR']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Visible</FormLabel>
                      <FormDescription>
                        Make this FAQ visible to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <TranslationStatus
              translations={translation}
              onCopy={copyFromLanguage}
              currentLang={activeTab as 'pt-BR' | 'en'}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pt-BR" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Português
                  {translation['pt-BR'] && <Badge variant="outline" className="ml-2">✓</Badge>}
                </TabsTrigger>
                <TabsTrigger value="en" className="gap-2">
                  <Languages className="h-4 w-4" />
                  English
                  {translation['en'] && <Badge variant="outline" className="ml-2">✓</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pt-BR" className="space-y-4">
                <FormField
                  control={form.control}
                  name="question.pt-BR"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Question (PT-BR)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Como faço para me inscrever no evento?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer.pt-BR"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Answer (PT-BR)</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Digite a resposta em português..."
                        />
                      </FormControl>
                      {answerSize['pt-BR'] > 10000 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Answer size: {(answerSize['pt-BR'] / 1024).toFixed(2)} KB / 10 KB max
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                {!translation['pt-BR'] && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fill in the Portuguese version first
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="question.en"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Question (EN)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: How do I register for the event?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer.en"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Answer (EN)</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Type the answer in English..."
                        />
                      </FormControl>
                      {answerSize['en'] > 10000 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Answer size: {(answerSize['en'] / 1024).toFixed(2)} KB / 10 KB max
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : (faq ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
}