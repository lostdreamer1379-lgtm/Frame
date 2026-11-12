import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchPartyService } from '@/services/watchParty.service';

export const watchPartyKeys = {
  all: ['watch-parties'] as const,
  detail: (code: string) => [...watchPartyKeys.all, code] as const,
};

export function useWatchParty(code: string | undefined) {
  return useQuery({
    queryKey: watchPartyKeys.detail(code ?? ''),
    queryFn: () => watchPartyService.get(code!),
    enabled: !!code,
    refetchInterval: 3000,
  });
}

export function useCreateWatchParty() {
  return useMutation({ mutationFn: (tmdbMovieId: number) => watchPartyService.create(tmdbMovieId) });
}

export function useJoinWatchParty(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) => watchPartyService.join(code, displayName),
    onSuccess: ({ party }) => queryClient.setQueryData(watchPartyKeys.detail(code), party),
  });
}

export function useUpdateWatchPartyState(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currentPosition, isPlaying }: { currentPosition: number; isPlaying: boolean }) =>
      watchPartyService.updateState(code, currentPosition, isPlaying),
    onSuccess: (party) => queryClient.setQueryData(watchPartyKeys.detail(code), party),
  });
}

export function useSendWatchPartyMessage(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, text }: { participantId: string; text: string }) =>
      watchPartyService.sendMessage(code, participantId, text),
    onSuccess: (party) => queryClient.setQueryData(watchPartyKeys.detail(code), party),
  });
}
