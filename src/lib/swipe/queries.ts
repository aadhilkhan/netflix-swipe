import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRoom,
  joinRoom,
  getRoomState,
  submitSwipe,
  getMatches,
} from '~/server/function/swipe';
import { toast } from 'sonner';

export interface SwipeRoomState {
  hasPartner: boolean;
  totalShows: number;
  myProgress: number;
  partnerProgress: number;
  matchCount: number;
  showOrder: string[];
}

export interface SwipeMatches {
  matches: string[];
}

function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

export const swipeQueryKeys = {
  roomState: (code: string, sessionId: string) =>
    ['swipe', 'room', normalizeRoomCode(code), sessionId] as const,
  matches: (code: string, sessionId: string) =>
    ['swipe', 'matches', normalizeRoomCode(code), sessionId] as const,
};

export const swipeQueries = {
  roomState: (code: string, sessionId: string) =>
    queryOptions({
      queryKey: swipeQueryKeys.roomState(code, sessionId),
      queryFn: async ({ signal }) =>
        await getRoomState({ data: { code: normalizeRoomCode(code), sessionId }, signal }),
      staleTime: 1000 * 5,
      refetchInterval: 10_000,
    }),
  matches: (code: string, sessionId: string) =>
    queryOptions({
      queryKey: swipeQueryKeys.matches(code, sessionId),
      queryFn: async ({ signal }) =>
        await getMatches({ data: { code: normalizeRoomCode(code), sessionId }, signal }),
      staleTime: 1000 * 30,
      refetchInterval: 10_000,
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
      await joinRoom({ data: { code: normalizeRoomCode(code), sessionId } }),
    onError: (error) => {
      toast.error(error.message || 'Failed to join room');
    },
  });
}

export function useSubmitSwipeMutation(code: string, sessionId: string) {
  const queryClient = useQueryClient();
  const normalizedCode = normalizeRoomCode(code);
  const roomStateQueryKey = swipeQueryKeys.roomState(normalizedCode, sessionId);
  const matchesQueryKey = swipeQueryKeys.matches(normalizedCode, sessionId);

  return useMutation({
    mutationFn: async ({
      showId,
      direction,
    }: {
      showId: string;
      direction: 'like' | 'nope';
    }) =>
      await submitSwipe({
        data: {
          code: normalizedCode,
          sessionId,
          showId,
          direction,
        },
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: roomStateQueryKey });
      const previousRoomState =
        queryClient.getQueryData<SwipeRoomState>(roomStateQueryKey);

      if (previousRoomState) {
        queryClient.setQueryData<SwipeRoomState>(roomStateQueryKey, {
          ...previousRoomState,
          myProgress: Math.min(
            previousRoomState.totalShows,
            previousRoomState.myProgress + 1,
          ),
        });
      }

      return { previousRoomState };
    },
    onSuccess: (data) => {
      if (!data.isMatch) return;

      queryClient.setQueryData<SwipeMatches | undefined>(
        matchesQueryKey,
        (previous) => {
          if (!previous) return previous;
          if (previous.matches.includes(data.showId)) return previous;
          return { matches: [...previous.matches, data.showId] };
        },
      );
    },
    onError: (error, _variables, context) => {
      if (context?.previousRoomState) {
        queryClient.setQueryData(roomStateQueryKey, context.previousRoomState);
      }
      toast.error(error.message || 'Failed to record swipe');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roomStateQueryKey });
      queryClient.invalidateQueries({ queryKey: matchesQueryKey });
    },
  });
}
