import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { SHOWS } from '~/lib/shows/data';
import type { Room } from '~/lib/shows/types';

// In-memory room store
const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const ROOM_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const VALID_SHOW_IDS = new Set(SHOWS.map((show) => show.id));

const sessionIdSchema = z.string().trim().min(1);
const roomCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => ROOM_CODE_REGEX.test(value), 'Invalid room code');

function pruneExpiredRooms(now = Date.now()) {
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

function getRoomOrThrow(code: string): Room {
  const room = rooms.get(code);
  if (!room) {
    throw new Error('Room not found. Check the code and try again.');
  }
  return room;
}

function getUserSwipesOrThrow(room: Room, sessionId: string) {
  const userSwipes = room.users.get(sessionId);
  if (!userSwipes) {
    throw new Error('You are not in this room.');
  }
  return userSwipes;
}

function countMatches(room: Room) {
  if (room.users.size < 2) return 0;

  const [firstUser, secondUser] = Array.from(room.users.values());
  let matchCount = 0;

  for (const showId of firstUser.liked) {
    if (secondUser.liked.has(showId)) {
      matchCount++;
    }
  }

  return matchCount;
}

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
    return z.object({ sessionId: sessionIdSchema }).parse(data);
  })
  .handler(async ({ data }) => {
    pruneExpiredRooms();

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
        code: roomCodeSchema,
        sessionId: sessionIdSchema,
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    pruneExpiredRooms();
    const room = getRoomOrThrow(data.code);

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
        code: roomCodeSchema,
        sessionId: sessionIdSchema,
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    pruneExpiredRooms();
    const room = getRoomOrThrow(data.code);
    const userSwipes = getUserSwipesOrThrow(room, data.sessionId);

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

    return {
      hasPartner,
      totalShows,
      myProgress,
      partnerProgress,
      matchCount: countMatches(room),
      showOrder: room.showOrder,
    };
  });

export const submitSwipe = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        code: roomCodeSchema,
        sessionId: sessionIdSchema,
        showId: z
          .string()
          .trim()
          .refine((showId) => VALID_SHOW_IDS.has(showId), 'Invalid show'),
        direction: z.enum(['like', 'nope']),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    pruneExpiredRooms();
    const room = getRoomOrThrow(data.code);
    const userSwipes = getUserSwipesOrThrow(room, data.sessionId);

    if (!room.showOrder.includes(data.showId)) {
      throw new Error('Show is not part of this room.');
    }

    const hasLiked = userSwipes.liked.has(data.showId);
    const hasNoped = userSwipes.noped.has(data.showId);

    if (hasLiked || hasNoped) {
      const isMatch =
        hasLiked &&
        Array.from(room.users.entries()).some(
          ([id, swipes]) => id !== data.sessionId && swipes.liked.has(data.showId),
        );

      return { isMatch, showId: data.showId, alreadySwiped: true };
    }

    if (data.direction === 'like') {
      userSwipes.noped.delete(data.showId);
      userSwipes.liked.add(data.showId);
    } else {
      userSwipes.liked.delete(data.showId);
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

    return { isMatch, showId: data.showId, alreadySwiped: false };
  });

export const getMatches = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        code: roomCodeSchema,
        sessionId: sessionIdSchema,
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    pruneExpiredRooms();
    const room = getRoomOrThrow(data.code);
    getUserSwipesOrThrow(room, data.sessionId);

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
