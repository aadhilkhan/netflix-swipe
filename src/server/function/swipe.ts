import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { SHOWS } from '~/lib/shows/data';
import type { Room, UserSwipes } from '~/lib/shows/types';

// In-memory room store
const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const createRoom = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z.object({ sessionId: z.string().min(1) }).parse(data);
  })
  .handler(async ({ data }) => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const room: Room = {
      code,
      showOrder: shuffleArray(SHOWS.map((s) => s.id)),
      users: new Map([[data.sessionId, { liked: new Set(), noped: new Set() }]]),
      createdAt: Date.now(),
    };
    rooms.set(code, room);

    return { code };
  });

export const joinRoom = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        code: z.string().length(6),
        sessionId: z.string().min(1),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const room = rooms.get(data.code.toUpperCase());
    if (!room) {
      throw new Error('Room not found. Check the code and try again.');
    }
    if (room.users.size >= 2 && !room.users.has(data.sessionId)) {
      throw new Error('Room is full.');
    }
    if (!room.users.has(data.sessionId)) {
      room.users.set(data.sessionId, { liked: new Set(), noped: new Set() });
    }
    return { code: room.code };
  });

export const getRoomState = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        code: z.string(),
        sessionId: z.string().min(1),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const room = rooms.get(data.code);
    if (!room) {
      throw new Error('Room not found');
    }

    const userSwipes = room.users.get(data.sessionId);
    if (!userSwipes) {
      throw new Error('You are not in this room');
    }

    const totalShows = room.showOrder.length;
    const myProgress = userSwipes.liked.size + userSwipes.noped.size;
    const hasPartner = room.users.size === 2;

    // Calculate partner progress
    let partnerProgress = 0;
    for (const [id, swipes] of room.users) {
      if (id !== data.sessionId) {
        partnerProgress = swipes.liked.size + swipes.noped.size;
      }
    }

    // Count current matches
    let matchCount = 0;
    if (hasPartner) {
      const users = Array.from(room.users.values());
      for (const showId of users[0].liked) {
        if (users[1].liked.has(showId)) {
          matchCount++;
        }
      }
    }

    return {
      hasPartner,
      totalShows,
      myProgress,
      partnerProgress,
      matchCount,
      showOrder: room.showOrder,
    };
  });

export const submitSwipe = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        code: z.string(),
        sessionId: z.string().min(1),
        showId: z.string(),
        direction: z.enum(['like', 'nope']),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const room = rooms.get(data.code);
    if (!room) {
      throw new Error('Room not found');
    }

    const userSwipes = room.users.get(data.sessionId);
    if (!userSwipes) {
      throw new Error('You are not in this room');
    }

    if (data.direction === 'like') {
      userSwipes.liked.add(data.showId);
    } else {
      userSwipes.noped.add(data.showId);
    }

    // Check if this creates a match (both users liked this show)
    let isMatch = false;
    if (data.direction === 'like') {
      for (const [id, swipes] of room.users) {
        if (id !== data.sessionId && swipes.liked.has(data.showId)) {
          isMatch = true;
          break;
        }
      }
    }

    return { isMatch, showId: data.showId };
  });

export const getMatches = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z.object({ code: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    const room = rooms.get(data.code);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.users.size < 2) {
      return { matches: [] as string[] };
    }

    const users = Array.from(room.users.values());
    const matches: string[] = [];
    for (const showId of users[0].liked) {
      if (users[1].liked.has(showId)) {
        matches.push(showId);
      }
    }

    return { matches };
  });
