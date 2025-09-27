import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaqCategoriesList } from '@/components/faq-categories/FaqCategoriesList';
import { FaqCategoryDialog } from '@/components/faq-categories/FaqCategoryDialog';
import { faqCategoriesService } from '@/services/faq-categories.service';
import type { FaqCategory } from '@shared/types/faq.types';
import { useToast } from '@/hooks/useToast';

export function FaqCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await faqCategoriesService.getAll();
      setCategories(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load FAQ categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: FaqCategory) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await faqCategoriesService.delete(id);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      loadCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category. It may have associated FAQs.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (data: Partial<FaqCategory>) => {
    try {
      console.log('handleSave called with data:', data);

      if (selectedCategory?._id) {
        await faqCategoriesService.update(selectedCategory._id, data);
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        // Calculate the next order value for new categories
        const categoriesArray = Array.isArray(categories) ? categories : [];
        const maxOrder = categoriesArray.length > 0
          ? categoriesArray.reduce((max, cat) => Math.max(max, cat.order || 0), 0)
          : 0;
        const newData = {
          ...data,
          order: maxOrder + 1
        };
        console.log('Creating category with data:', newData);
        await faqCategoriesService.create(newData);
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const handleOrderChange = async (updatedCategories: FaqCategory[]) => {
    try {
      await Promise.all(
        updatedCategories.map((cat, index) =>
          cat._id ? faqCategoriesService.updateOrder(cat._id, index) : Promise.resolve()
        )
      );
      setCategories(updatedCategories);
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
      loadCategories();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FAQ Categories</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <FaqCategoriesList
        categories={categories}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOrderChange={handleOrderChange}
      />

      <FaqCategoryDialog
        category={selectedCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}