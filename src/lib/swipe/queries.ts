import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRoom,
  joinRoom,
  getRoomState,
  submitSwipe,
  getMatches,
} from '~/server/function/swipe';
import { toast } from 'sonner';

export const swipeQueries = {
  roomState: (code: string, sessionId: string) =>
    queryOptions({
      queryKey: ['swipe', 'room', code],
      queryFn: async ({ signal }) =>
        await getRoomState({ data: { code, sessionId }, signal }),
      staleTime: 1000 * 5,
      refetchInterval: 10_000,
    }),
  matches: (code: string) =>
    queryOptions({
      queryKey: ['swipe', 'matches', code],
      queryFn: async ({ signal }) => await getMatches({ data: { code }, signal }),
      staleTime: 1000 * 30,
    }),
};

export function useCreateRoomMutation() {
  return useMutation({
    mutationFn: async (sessionId: string) => await createRoom({ data: { sessionId } }),
    onError: (error) => {
      toast.error(error.message || 'Failed to create room');
    },
  });
}

export function useJoinRoomMutation() {
  return useMutation({
    mutationFn: async ({ code, sessionId }: { code: string; sessionId: string }) =>
      await joinRoom({ data: { code, sessionId } }),
    onError: (error) => {
      toast.error(error.message || 'Failed to join room');
    },
  });
}

export function useSubmitSwipeMutation(code: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      showId,
      direction,
    }: {
      sessionId: string;
      showId: string;
      direction: 'like' | 'nope';
    }) => await submitSwipe({ data: { code, sessionId, showId, direction } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swipe', 'room', code] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record swipe');
    },
  });
}
