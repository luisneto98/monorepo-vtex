import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import newsReleasesService from '../services/news-releases.service';
import {
  type CreateNewsReleaseDto,
  type UpdateNewsReleaseDto,
  type NewsReleaseFilter,
} from '@shared/types/news-releases';
import { useToast } from './use-toast';

export function useNewsReleases(initialFilters?: NewsReleaseFilter) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NewsReleaseFilter>(
    initialFilters || {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  );

  const {
    data: newsReleasesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['newsReleases', filters],
    queryFn: () => newsReleasesService.getNewsReleases(filters),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateNewsReleaseDto) => newsReleasesService.createNewsRelease(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsReleases'] });
      toast({
        title: 'Success',
        description: 'News release created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create news release',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNewsReleaseDto }) =>
      newsReleasesService.updateNewsRelease(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsReleases'] });
      toast({
        title: 'Success',
        description: 'News release updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update news release',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsReleasesService.deleteNewsRelease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsReleases'] });
      toast({
        title: 'Success',
        description: 'News release deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete news release',
        variant: 'destructive',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => newsReleasesService.publishNewsRelease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsReleases'] });
      toast({
        title: 'Success',
        description: 'News release published successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to publish news release',
        variant: 'destructive',
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => newsReleasesService.archiveNewsRelease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsReleases'] });
      toast({
        title: 'Success',
        description: 'News release archived successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to archive news release',
        variant: 'destructive',
      });
    },
  });

  const bulkOperationMutation = useMutation({
    mutationFn: async ({
      ids,
      operation,
    }: {
      ids: string[];
      operation: 'publish' | 'archive' | 'delete';
    }) => {
      switch (operation) {
        case 'publish':
          return newsReleasesService.bulkPublish(ids);
        case 'archive':
          return newsReleasesService.bulkArchive(ids);
        case 'delete':
          return newsReleasesService.bulkDelete(ids);
      }
    },
    onSuccess: (_, { operation }) => {
      queryClient.invalidateQueries({ queryKey: ['newsReleases'] });
      toast({
        title: 'Success',
        description: `Selected items ${operation}ed successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Bulk operation failed',
        variant: 'destructive',
      });
    },
  });

  const updateFilters = useCallback((newFilters: Partial<NewsReleaseFilter>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleSort = useCallback((field: NewsReleaseFilter['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return {
    newsReleases: newsReleasesData?.items || [],
    total: newsReleasesData?.total || 0,
    page: newsReleasesData?.page || 1,
    pages: newsReleasesData?.pages || 1,
    isLoading,
    error,
    filters,
    createNewsRelease: createMutation.mutate,
    updateNewsRelease: updateMutation.mutate,
    deleteNewsRelease: deleteMutation.mutate,
    publishNewsRelease: publishMutation.mutate,
    archiveNewsRelease: archiveMutation.mutate,
    bulkOperation: bulkOperationMutation.mutate,
    updateFilters,
    resetFilters,
    handlePageChange,
    handleSort,
    refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPublishing: publishMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isBulkOperating: bulkOperationMutation.isPending,
  };
}
