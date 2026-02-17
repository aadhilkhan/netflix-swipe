import { X, Heart } from 'lucide-react';

interface SwipeActionsProps {
  onNope: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function SwipeActions({ onNope, onLike, disabled }: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      <button
        type="button"
        onClick={onNope}
        disabled={disabled}
        aria-label="Pass on this show"
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-500/10 text-red-500 transition-all hover:scale-110 hover:bg-red-500/20 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      >
        <X className="h-7 w-7" />
      </button>
      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        aria-label="Like this show"
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500/50 bg-green-500/10 text-green-500 transition-all hover:scale-110 hover:bg-green-500/20 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      >
        <Heart className="h-7 w-7" />
      </button>
    </div>
  );
}
