import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { useCreateRoomMutation, useJoinRoomMutation } from '~/lib/swipe/queries';

const searchSchema = z.object({
  sid: z.string().uuid().optional(),
});

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (search.sid) return;

    throw redirect({
      to: '/',
      search: {
        sid: crypto.randomUUID(),
      },
      replace: true,
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { sid } = Route.useSearch();
  if (!sid) return null;
  return <SwipeLanding sessionId={sid} />;
}

function SwipeLanding({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const createRoomMutation = useCreateRoomMutation();
  const joinRoomMutation = useJoinRoomMutation();

  const handleCreate = () => {
    createRoomMutation.mutate(sessionId, {
      onSuccess: (data) => {
        navigate({
          to: '/swipe/$roomId',
          params: { roomId: data.code },
          search: { sid: sessionId },
        });
      },
    });
  };

  const handleJoin = () => {
    if (joinCode.length !== 6) return;
    joinRoomMutation.mutate(
      { code: joinCode.toUpperCase(), sessionId },
      {
        onSuccess: (data) => {
          navigate({
            to: '/swipe/$roomId',
            params: { roomId: data.code },
            search: { sid: sessionId },
          });
        },
      },
    );
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-5xl font-bold text-transparent">
          Netflix & Decide
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          Swipe on shows with your partner. Find what you both love.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {/* Create Room */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-1 text-lg font-semibold">Start a new session</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Create a room and share the code with your partner.
          </p>
          <Button
            onClick={handleCreate}
            disabled={createRoomMutation.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Join Room */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-1 text-lg font-semibold">Join a session</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Enter the 6-character code your partner shared.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="XXXXXX"
              maxLength={6}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-center font-mono text-lg tracking-[0.3em] text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <Button
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || joinRoomMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {joinRoomMutation.isPending ? '...' : 'Join'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
