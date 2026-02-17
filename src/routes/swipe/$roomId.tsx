import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Link,
  createFileRoute,
  redirect,
} from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { CardStack } from '~/components/swipe/CardStack';
import { MatchCelebration } from '~/components/swipe/MatchCelebration';
import { RoomCodeDisplay } from '~/components/swipe/RoomCodeDisplay';
import { SwipeActions } from '~/components/swipe/SwipeActions';
import { WaitingForPartner } from '~/components/swipe/WaitingForPartner';
import { getShowById } from '~/lib/shows/data';
import { swipeQueries, useSubmitSwipeMutation } from '~/lib/swipe/queries';
import type { Show } from '~/lib/shows/types';
import { Heart } from 'lucide-react';

const searchSchema = z.object({
  sid: z.string().uuid(),
});

export const Route = createFileRoute('/swipe/$roomId')({
  validateSearch: searchSchema,
  beforeLoad: ({ params, search }) => {
    const normalizedRoomId = params.roomId.toUpperCase();
    if (params.roomId === normalizedRoomId) return;

    throw redirect({
      to: '/swipe/$roomId',
      params: { roomId: normalizedRoomId },
      search,
      replace: true,
    });
  },
  loaderDeps: ({ search }) => ({
    sid: search.sid,
  }),
  loader: async ({ context, params, deps }) => {
    await context.queryClient.ensureQueryData(
      swipeQueries.roomState(params.roomId, deps.sid),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { roomId } = Route.useParams();
  const { sid: sessionId } = Route.useSearch();

  return <SwipeRoom roomId={roomId} sessionId={sessionId} />;
}

function SwipeRoom({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  const [matchedShow, setMatchedShow] = useState<Show | null>(null);
  const [triggerSwipe, setTriggerSwipe] = useState<'like' | 'nope' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const roomQuery = useSuspenseQuery(swipeQueries.roomState(roomId, sessionId));
  const swipeMutation = useSubmitSwipeMutation(roomId, sessionId);

  const showOrder = roomQuery.data.showOrder ?? [];
  const orderedShows = showOrder
    .map((id) => getShowById(id))
    .filter((s): s is Show => s !== undefined);

  const currentIndex = Math.min(roomQuery.data.myProgress, orderedShows.length);

  const commitSwipe = useCallback(
    (direction: 'like' | 'nope') => {
      const show = orderedShows[currentIndex];
      if (!show) return;

      swipeMutation.mutate(
        { showId: show.id, direction },
        {
          onSuccess: (data) => {
            if (!data.isMatch) return;

            const matched = getShowById(data.showId);
            if (matched) {
              setMatchedShow(matched);
            }
          },
        },
      );
    },
    [currentIndex, orderedShows, swipeMutation],
  );

  const handleSwipeAnimationComplete = useCallback(() => {
    setTriggerSwipe(null);
    setIsAnimating(false);
  }, []);

  const handleSwipeComplete = useCallback(
    (direction: 'like' | 'nope') => {
      commitSwipe(direction);
    },
    [commitSwipe],
  );

  const handleButtonSwipe = useCallback((direction: 'like' | 'nope') => {
    setIsAnimating(true);
    setTriggerSwipe(direction);
  }, []);

  const { hasPartner, totalShows, myProgress, matchCount } = roomQuery.data;

  if (!hasPartner) {
    return <WaitingForPartner code={roomId} />;
  }

  const isDone = currentIndex >= orderedShows.length;
  const progressWidth = totalShows > 0 ? (myProgress / totalShows) * 100 : 0;

  if (isDone) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4 text-center">
        <div className="text-5xl">🎬</div>
        <h2 className="text-2xl font-bold text-white">All done!</h2>
        <p className="text-zinc-400">
          You swiped through all {totalShows} shows.
          {matchCount > 0
            ? ` You matched on ${matchCount} show${matchCount !== 1 ? 's' : ''}!`
            : ' No matches yet - your partner may still be swiping.'}
        </p>
        <div className="flex gap-3">
          {matchCount > 0 && (
            <Link
              to="/swipe/$roomId/matches"
              params={{ roomId }}
              search={{ sid: sessionId }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-red-700"
            >
              <Heart className="h-4 w-4" />
              View Matches
            </Link>
          )}
          <Link
            to="/"
            search={{ sid: sessionId }}
            className="inline-flex items-center rounded-lg border border-zinc-700 px-5 py-2.5 font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            New Session
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <RoomCodeDisplay code={roomId} />
        <div className="flex items-center gap-3">
          {matchCount > 0 && (
            <Link
              to="/swipe/$roomId/matches"
              params={{ roomId }}
              search={{ sid: sessionId }}
              className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-3 py-1 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
            >
              <Heart className="h-3.5 w-3.5" />
              {matchCount}
            </Link>
          )}
          <span className="text-xs text-zinc-500">
            {myProgress}/{totalShows}
          </span>
        </div>
      </div>

      <div className="mx-4 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-red-600 transition-all duration-300"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <CardStack
          shows={orderedShows}
          currentIndex={currentIndex}
          onSwipe={handleSwipeComplete}
          triggerSwipe={triggerSwipe}
          onSwipeAnimationComplete={handleSwipeAnimationComplete}
        />
        <SwipeActions
          onNope={() => handleButtonSwipe('nope')}
          onLike={() => handleButtonSwipe('like')}
          disabled={isAnimating}
        />
      </div>

      {matchedShow && (
        <MatchCelebration
          show={matchedShow}
          onDismiss={() => setMatchedShow(null)}
        />
      )}
    </div>
  );
}
