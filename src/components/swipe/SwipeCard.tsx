import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from 'framer-motion';
import { useEffect } from 'react';
import type { Show } from '~/lib/shows/types';

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  show: Show;
  onSwipeComplete: (direction: 'like' | 'nope') => void;
  isTop: boolean;
  stackIndex: number;
  triggerSwipe?: 'like' | 'nope' | null;
}

export function SwipeCard({
  show,
  onSwipeComplete,
  isTop,
  stackIndex,
  triggerSwipe,
}: SwipeCardProps) {
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Button-triggered swipe animation
  useEffect(() => {
    if (triggerSwipe && isTop) {
      const targetX = triggerSwipe === 'like' ? 500 : -500;
      controls
        .start({
          x: targetX,
          rotate: triggerSwipe === 'like' ? 15 : -15,
          opacity: 0,
          transition: { duration: 0.3, ease: 'easeIn' },
        })
        .then(() => onSwipeComplete(triggerSwipe));
    }
  }, [triggerSwipe, isTop, controls, onSwipeComplete]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offsetX = info.offset.x;
    if (offsetX > SWIPE_THRESHOLD) {
      controls
        .start({
          x: 500,
          opacity: 0,
          transition: { duration: 0.25 },
        })
        .then(() => onSwipeComplete('like'));
    } else if (offsetX < -SWIPE_THRESHOLD) {
      controls
        .start({
          x: -500,
          opacity: 0,
          transition: { duration: 0.25 },
        })
        .then(() => onSwipeComplete('nope'));
    } else {
      // Snap back
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  const scale = 1 - stackIndex * 0.05;
  const yOffset = stackIndex * 8;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - stackIndex,
      }}
      animate={isTop ? controls : undefined}
      initial={{ scale, y: yOffset }}
      drag={isTop ? 'x' : false}
      dragElastic={1}
      dragMomentum={false}
      onDragEnd={isTop ? handleDragEnd : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}
      >
        {/* Poster */}
        <img
          src={show.posterUrl}
          alt={show.title}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* LIKE stamp */}
        {isTop && (
          <motion.div
            className="absolute top-8 left-6 -rotate-12 rounded-lg border-4 border-green-500 px-4 py-2"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-3xl font-black text-green-500">LIKE</span>
          </motion.div>
        )}

        {/* NOPE stamp */}
        {isTop && (
          <motion.div
            className="absolute top-8 right-6 rotate-12 rounded-lg border-4 border-red-500 px-4 py-2"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-3xl font-black text-red-500">NOPE</span>
          </motion.div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">{show.title}</h2>
            <span className="text-zinc-400">({show.year})</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-zinc-700/80 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
              {show.rating}
            </span>
            {show.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-zinc-700/80 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
              >
                {genre}
              </span>
            ))}
          </div>
          <p className="line-clamp-2 text-sm text-zinc-300">{show.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
