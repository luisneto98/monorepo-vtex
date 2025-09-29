import { useEffect } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FaqCategory } from '@shared/types/faq.types';

const faqCategorySchema = z.object({
  name: z.object({
    'pt-BR': z.string().min(1, 'Name in Portuguese is required'),
    'en': z.string().min(1, 'Name in English is required'),
  }),
});

type FaqCategoryFormData = z.infer<typeof faqCategorySchema>;

interface FaqCategoryDialogProps {
  category: FaqCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<FaqCategory>) => Promise<void>;
}

export function FaqCategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: FaqCategoryDialogProps) {
  const form = useForm<FaqCategoryFormData>({
    resolver: zodResolver(faqCategorySchema),
    defaultValues: {
      name: {
        'pt-BR': '',
        'en': '',
      },
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
      });
    } else {
      form.reset({
        name: {
          'pt-BR': '',
          'en': '',
        },
      });
    }
  }, [category, form]);

  const handleSubmit = async (data: FaqCategoryFormData) => {
    console.log('Form submitted with data:', data);
    try {
      await onSave(data);
      form.reset();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit FAQ Category' : 'Create FAQ Category'}
          </DialogTitle>
          <DialogDescription>
            Enter the category name in both languages. Categories help organize FAQs for better navigation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => {
          console.log('Form onSubmit triggered');
          form.handleSubmit(handleSubmit)(e);
        }} className="space-y-6">
            <Tabs defaultValue="pt-BR" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pt-BR">Português</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>

              <TabsContent value="pt-BR" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name.pt-BR"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Category Name (PT-BR)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Inscrições e Ingressos"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name.en"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Category Name (EN)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Registration and Tickets"
                          {...field}
                        />
                      </FormControl>
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={() => console.log('Create/Update button clicked')}
              >
                {category ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
}