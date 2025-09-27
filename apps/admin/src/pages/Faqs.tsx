import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaqsList } from '@/components/faqs/FaqsList';
import { FaqDialog } from '@/components/faqs/FaqDialog';
import { faqService } from '@/services/faq.service';
import { faqCategoriesService } from '@/services/faq-categories.service';
import type { Faq, FaqCategory } from '@shared/types/faq.types';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function Faqs() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [debouncedSearch, categoryFilter, visibilityFilter]);

  const loadCategories = async () => {
    try {
      const data = await faqCategoriesService.getAll();
      setCategories(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  };

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (visibilityFilter !== 'all') {
        params.isVisible = visibilityFilter === 'visible';
      }

      const data = await faqService.getAll(params);
      setFaqs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load FAQs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedFaq(null);
    setDialogOpen(true);
  };

  const handleEdit = (faq: Faq) => {
    setSelectedFaq(faq);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await faqService.delete(id);
      toast({
        title: 'Success',
        description: 'FAQ deleted successfully',
      });
      loadFaqs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (data: Partial<Faq>) => {
    try {
      if (selectedFaq?._id) {
        await faqService.update(selectedFaq._id, data);
        toast({
          title: 'Success',
          description: 'FAQ updated successfully',
        });
      } else {
        await faqService.create(data);
        toast({
          title: 'Success',
          description: 'FAQ created successfully',
        });
      }
      setDialogOpen(false);
      loadFaqs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleOrderChange = async (updatedFaqs: Faq[]) => {
    try {
      await Promise.all(
        updatedFaqs.map((faq, index) =>
          faq._id ? faqService.updateOrder(faq._id, index) : Promise.resolve()
        )
      );
      setFaqs(updatedFaqs);
      toast({
        title: 'Success',
        description: 'Order updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
      loadFaqs();
    }
  };

  const handleToggleVisibility = async (faq: Faq) => {
    try {
      await faqService.update(faq._id, { isVisible: !faq.isVisible });
      toast({
        title: 'Success',
        description: `FAQ ${faq.isVisible ? 'hidden' : 'shown'} successfully`,
      });
      loadFaqs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  const handleIncrementView = async (id: string) => {
    try {
      await faqService.incrementView(id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FAQs</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search questions and answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id || ''}>
                {category.name['pt-BR']}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={(value: any) => setVisibilityFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All FAQs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All FAQs</SelectItem>
            <SelectItem value="visible">Visible Only</SelectItem>
            <SelectItem value="hidden">Hidden Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FaqsList
        faqs={faqs}
        categories={categories}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOrderChange={handleOrderChange}
        onToggleVisibility={handleToggleVisibility}
        onView={handleIncrementView}
      />

      <FaqDialog
        faq={selectedFaq}
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}