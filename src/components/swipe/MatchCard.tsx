import type { Show } from '~/lib/shows/types';

interface MatchCardProps {
  show: Show;
}

export function MatchCard({ show }: MatchCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700">
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={show.posterUrl}
          alt={show.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-white truncate">{show.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
          <span>{show.year}</span>
          <span className="text-zinc-600">|</span>
          <span>{show.rating}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {show.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
