import { createFileRoute, Link } from '@tanstack/react-router';
import { ClientOnly } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { swipeQueries, useSubmitSwipeMutation } from '~/lib/swipe/queries';
import { getShowById } from '~/lib/shows/data';
import type { Show } from '~/lib/shows/types';
import { CardStack } from '~/components/swipe/CardStack';
import { SwipeActions } from '~/components/swipe/SwipeActions';
import { RoomCodeDisplay } from '~/components/swipe/RoomCodeDisplay';
import { WaitingForPartner } from '~/components/swipe/WaitingForPartner';
import { MatchCelebration } from '~/components/swipe/MatchCelebration';
import { Heart } from 'lucide-react';

export const Route = createFileRoute('/swipe/$roomId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { roomId } = Route.useParams();
  return (
    <ClientOnly
      fallback={
        <div className="flex min-h-svh items-center justify-center text-zinc-400">
          Loading...
        </div>
      }
    >
      <SwipeRoom roomId={roomId} />
    </ClientOnly>
  );
}

function SwipeRoom({ roomId }: { roomId: string }) {
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('swipe-session-id');
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem('swipe-session-id', id);
    return id;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedShow, setMatchedShow] = useState<Show | null>(null);
  const [triggerSwipe, setTriggerSwipe] = useState<'like' | 'nope' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const roomQuery = useQuery(swipeQueries.roomState(roomId, sessionId));
  const swipeMutation = useSubmitSwipeMutation(roomId);

  const showOrder = roomQuery.data?.showOrder ?? [];
  const orderedShows = showOrder
    .map((id) => getShowById(id))
    .filter((s): s is Show => s !== undefined);

  const commitSwipe = useCallback(
    (direction: 'like' | 'nope') => {
      const show = orderedShows[currentIndex];
      if (!show) return;

      swipeMutation.mutate(
        { sessionId, showId: show.id, direction },
        {
          onSuccess: (data) => {
            if (data.isMatch) {
              const matched = getShowById(data.showId);
              if (matched) setMatchedShow(matched);
            }
          },
        },
      );

      setCurrentIndex((i) => i + 1);
    },
    [currentIndex, orderedShows, sessionId, swipeMutation],
  );

  // Called when the card's exit animation finishes
  const handleSwipeAnimationComplete = useCallback(() => {
    setTriggerSwipe(null);
    setIsAnimating(false);
  }, []);

  // Called from drag-to-swipe (animation already happened in the card)
  const handleDragSwipe = useCallback(
    (direction: 'like' | 'nope') => {
      commitSwipe(direction);
    },
    [commitSwipe],
  );

  // Called from button press — triggers animation first
  const handleButtonSwipe = useCallback(
    (direction: 'like' | 'nope') => {
      if (isAnimating) return;
      setIsAnimating(true);
      setTriggerSwipe(direction);
      commitSwipe(direction);
    },
    [isAnimating, commitSwipe],
  );

  if (roomQuery.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-zinc-400">
        Loading room...
      </div>
    );
  }

  if (roomQuery.isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-red-400">{roomQuery.error.message}</p>
        <Link
          to="/"
          className="text-sm text-red-400 underline underline-offset-4 hover:text-red-300"
        >
          Back to lobby
        </Link>
      </div>
    );
  }

  const { hasPartner, totalShows, myProgress, matchCount } = roomQuery.data!;

  if (!hasPartner) {
    return <WaitingForPartner code={roomId} />;
  }

  const isDone = currentIndex >= orderedShows.length;

  if (isDone) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4 text-center">
        <div className="text-5xl">🎬</div>
        <h2 className="text-2xl font-bold text-white">All done!</h2>
        <p className="text-zinc-400">
          You swiped through all {totalShows} shows.
          {matchCount > 0
            ? ` You matched on ${matchCount} show${matchCount !== 1 ? 's' : ''}!`
            : ' No matches yet — your partner may still be swiping.'}
        </p>
        <div className="flex gap-3">
          {matchCount > 0 && (
            <Link
              to="/swipe/$roomId/matches"
              params={{ roomId }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-red-700"
            >
              <Heart className="h-4 w-4" />
              View Matches
            </Link>
          )}
          <Link
            to="/"
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <RoomCodeDisplay code={roomId} />
        <div className="flex items-center gap-3">
          {matchCount > 0 && (
            <Link
              to="/swipe/$roomId/matches"
              params={{ roomId }}
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

      {/* Progress bar */}
      <div className="mx-4 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-red-600 transition-all duration-300"
          style={{ width: `${(myProgress / totalShows) * 100}%` }}
        />
      </div>

      {/* Card Stack */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <CardStack
          shows={orderedShows}
          currentIndex={currentIndex}
          onSwipe={handleDragSwipe}
          triggerSwipe={triggerSwipe}
          onSwipeAnimationComplete={handleSwipeAnimationComplete}
        />
        <SwipeActions
          onNope={() => handleButtonSwipe('nope')}
          onLike={() => handleButtonSwipe('like')}
          disabled={isAnimating}
        />
      </div>

      {/* Match celebration overlay */}
      {matchedShow && (
        <MatchCelebration
          show={matchedShow}
          onDismiss={() => setMatchedShow(null)}
        />
      )}
    </div>
  );
}
