import { useState, useCallback } from 'react';
import { SwipeCard } from './SwipeCard';
import type { Show } from '~/lib/shows/types';

interface CardStackProps {
  shows: Show[];
  currentIndex: number;
  onSwipe: (direction: 'like' | 'nope') => void;
  triggerSwipe: 'like' | 'nope' | null;
  onSwipeAnimationComplete: () => void;
}

export function CardStack({
  shows,
  currentIndex,
  onSwipe,
  triggerSwipe,
  onSwipeAnimationComplete,
}: CardStackProps) {
  const visibleCards = shows.slice(currentIndex, currentIndex + 3);

  const handleSwipeComplete = useCallback(
    (direction: 'like' | 'nope') => {
      onSwipe(direction);
      onSwipeAnimationComplete();
    },
    [onSwipe, onSwipeAnimationComplete],
  );

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-[340px]">
      {visibleCards
        .slice()
        .reverse()
        .map((show, reversedI) => {
          const i = visibleCards.length - 1 - reversedI;
          return (
            <SwipeCard
              key={show.id}
              show={show}
              onSwipeComplete={handleSwipeComplete}
              isTop={i === 0}
              stackIndex={i}
              triggerSwipe={i === 0 ? triggerSwipe : null}
            />
          );
        })}
    </div>
  );
}
