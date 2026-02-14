import { motion } from 'framer-motion';
import { RoomCodeDisplay } from './RoomCodeDisplay';

interface WaitingForPartnerProps {
  code: string;
}

export function WaitingForPartner({ code }: WaitingForPartnerProps) {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 p-4 text-center">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-5xl"
      >
        👀
      </motion.div>
      <div>
        <h2 className="text-xl font-semibold text-white">Waiting for your partner</h2>
        <p className="mt-2 text-zinc-400">Share this room code:</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-8 py-4">
          <span className="font-mono text-4xl font-bold tracking-[0.4em] text-white">{code}</span>
        </div>
        <RoomCodeDisplay code={code} />
      </div>
      <p className="text-sm text-zinc-500">
        They can enter this code at the join screen.
      </p>
    </div>
  );
}
