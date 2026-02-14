import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { swipeQueries } from '~/lib/swipe/queries';
import { getShowById } from '~/lib/shows/data';
import type { Show } from '~/lib/shows/types';
import { MatchCard } from '~/components/swipe/MatchCard';
import { ArrowLeft, Heart } from 'lucide-react';

export const Route = createFileRoute('/swipe/$roomId/matches')({
  component: RouteComponent,
});

function RouteComponent() {
  const { roomId } = Route.useParams();

  const matchesQuery = useQuery(swipeQueries.matches(roomId));

  const matchedShows = (matchesQuery.data?.matches ?? [])
    .map((id) => getShowById(id))
    .filter((s): s is Show => s !== undefined);

  return (
    <div className="min-h-svh">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur">
        <Link
          to="/swipe/$roomId"
          params={{ roomId }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Heart className="h-5 w-5 text-red-500" />
          Matches
        </h1>
      </div>

      <div className="p-4">
        {matchesQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            Loading matches...
          </div>
        ) : matchedShows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="text-4xl">😢</div>
            <p className="text-zinc-400">No matches yet.</p>
            <p className="text-sm text-zinc-500">
              Keep swiping — your partner might still find common ground!
            </p>
            <Link
              to="/swipe/$roomId"
              params={{ roomId }}
              className="mt-2 text-sm text-red-400 underline underline-offset-4 hover:text-red-300"
            >
              Back to swiping
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              You and your partner both liked {matchedShows.length} show
              {matchedShows.length !== 1 ? 's' : ''}:
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {matchedShows.map((show) => (
                <MatchCard key={show.id} show={show} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
