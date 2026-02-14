import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { Show } from '~/lib/shows/types';

interface MatchCelebrationProps {
  show: Show;
  onDismiss: () => void;
}

export function MatchCelebration({ show, onDismiss }: MatchCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.h2
          className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-5xl font-black text-transparent"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          It's a Match!
        </motion.h2>

        <motion.div
          className="relative h-64 w-44 overflow-hidden rounded-xl shadow-2xl shadow-red-500/20"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
        >
          <img
            src={show.posterUrl}
            alt={show.title}
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.p
          className="text-lg font-semibold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {show.title}
        </motion.p>

        <motion.p
          className="text-sm text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          You both liked this one!
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
