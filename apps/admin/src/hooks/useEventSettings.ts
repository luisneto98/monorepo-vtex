import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventSettingsService } from '@/services/event-settings.service';
import type { EventSettings, UpdateEventSettingsDto } from '@vtexday26/shared';

export function useEventSettings() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery<EventSettings>({
    queryKey: ['event-settings'],
    queryFn: () => eventSettingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEventSettingsDto) =>
      eventSettingsService.updateSettings(data),
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['event-settings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(['event-settings']);

      // Optimistically update to the new value
      queryClient.setQueryData(['event-settings'], newSettings);

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(['event-settings'], context.previousSettings);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['event-settings'] });
    },
  });

  return {
    data,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}