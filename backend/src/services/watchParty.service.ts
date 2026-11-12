import { randomBytes } from 'node:crypto';
import { getPrisma } from '../config/prisma';
import { profileService } from './profile.service';
import { AppError } from '../middleware/errorHandlers';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

function serialize(party: {
  id: string; code: string; hostUserId: string; tmdbMovieId: number;
  currentPosition: number; isPlaying: boolean; createdAt: Date; updatedAt: Date;
  lastActivityAt: Date; participants: { id: string; displayName: string; createdAt: Date; lastSeenAt: Date }[];
  messages?: { id: string; participantId: string; text: string; createdAt: Date; participant: { displayName: string } }[];
}) {
  return {
    id: party.id,
    code: party.code,
    hostUserId: party.hostUserId,
    tmdbMovieId: party.tmdbMovieId,
    currentPosition: party.currentPosition,
    isPlaying: party.isPlaying,
    createdAt: party.createdAt.toISOString(),
    updatedAt: party.updatedAt.toISOString(),
    lastActivityAt: party.lastActivityAt.toISOString(),
    participants: party.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      createdAt: participant.createdAt.toISOString(),
      lastSeenAt: participant.lastSeenAt.toISOString(),
    })),
    messages: (party.messages ?? []).map((message) => ({
      id: message.id,
      participantId: message.participantId,
      displayName: message.participant.displayName,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

async function findByCode(code: string) {
  const party = await getPrisma().watchParty.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      participants: { orderBy: { createdAt: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' }, take: 100, include: { participant: { select: { displayName: true } } } },
    },
  });
  if (!party) throw new AppError(404, 'Watch party not found', 'PARTY_NOT_FOUND');
  return party;
}

export const watchPartyService = {
  async create(authUserId: string, tmdbMovieId: number) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    let party;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        party = await prisma.watchParty.create({
          data: {
            code: makeCode(),
            hostUserId: profile.id,
            tmdbMovieId,
            participants: { create: { displayName: profile.displayName } },
          },
          include: {
            participants: true,
            messages: { include: { participant: { select: { displayName: true } } } },
          },
        });
        break;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
    return serialize(party!);
  },

  async get(code: string, authUserId?: string) {
    const party = await findByCode(code);
    let isHost = false;
    if (authUserId) {
      const profile = await profileService.getOrCreate(authUserId);
      isHost = profile.id === party.hostUserId;
    }
    return { ...serialize(party), isHost };
  },

  async join(code: string, displayName: string) {
    const prisma = getPrisma();
    const party = await findByCode(code);
    const participant = await prisma.watchPartyParticipant.create({
      data: { partyId: party.id, displayName },
    });
    await prisma.watchParty.update({ where: { id: party.id }, data: { lastActivityAt: new Date() } });
    return { participantId: participant.id, party: serialize(await findByCode(code)) };
  },

  async sendMessage(code: string, participantId: string, text: string) {
    const prisma = getPrisma();
    const party = await findByCode(code);
    const participant = party.participants.find((item) => item.id === participantId);
    if (!participant) throw new AppError(403, 'Join the party before chatting', 'PARTY_MEMBER_REQUIRED');
    await prisma.watchPartyMessage.create({ data: { partyId: party.id, participantId, text } });
    await prisma.watchParty.update({ where: { id: party.id }, data: { lastActivityAt: new Date() } });
    return serialize(await findByCode(code));
  },

  async updateState(authUserId: string, code: string, currentPosition: number, isPlaying: boolean) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    const party = await findByCode(code);
    if (party.hostUserId !== profile.id) throw new AppError(403, 'Only the host can control playback', 'PARTY_HOST_ONLY');
    const updated = await prisma.watchParty.update({
      where: { id: party.id },
      data: { currentPosition, isPlaying, lastActivityAt: new Date() },
      include: { participants: { orderBy: { createdAt: 'asc' } } },
    });
    return serialize(updated);
  },
};
