import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pressMaterialsService } from '@/services/press-materials.service';
import { useToast } from '@/hooks/use-toast';
import type {
  CreatePressMaterialDto,
  UpdatePressMaterialDto,
  PressMaterialPaginationDto,
} from '@shared/types/press-materials';

export function usePressMaterials(params?: PressMaterialPaginationDto) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['press-materials', params],
    queryFn: () => pressMaterialsService.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePressMaterialDto) => pressMaterialsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Material criado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar material',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePressMaterialDto }) =>
      pressMaterialsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Material atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar material',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pressMaterialsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Material excluído com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir material',
        variant: 'destructive',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => pressMaterialsService.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Materiais excluídos com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir materiais',
        variant: 'destructive',
      });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'draft' | 'published' | 'archived' }) =>
      pressMaterialsService.updateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status',
        variant: 'destructive',
      });
    },
  });

  const bulkAccessMutation = useMutation({
    mutationFn: ({ ids, accessLevel }: { ids: string[]; accessLevel: 'public' | 'restricted' }) =>
      pressMaterialsService.updateAccess(ids, accessLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Nível de acesso atualizado com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar nível de acesso',
        variant: 'destructive',
      });
    },
  });

  const addTagsMutation = useMutation({
    mutationFn: ({ ids, tags }: { ids: string[]; tags: string[] }) =>
      pressMaterialsService.addTags(ids, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-materials'] });
      toast({
        title: 'Sucesso',
        description: 'Tags adicionadas com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar tags',
        variant: 'destructive',
      });
    },
  });

  return {
    materials: query.data?.data || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    limit: query.data?.limit || 10,
    totalPages: query.data?.totalPages || 1,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createMaterial: createMutation.mutate,
    updateMaterial: updateMutation.mutate,
    deleteMaterial: deleteMutation.mutate,
    deleteMany: bulkDeleteMutation.mutate,
    updateStatus: bulkStatusMutation.mutate,
    updateAccess: bulkAccessMutation.mutate,
    addTags: addTagsMutation.mutate,
  };
}
