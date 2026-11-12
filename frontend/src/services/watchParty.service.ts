import { apiClient } from '@/lib/api';

export interface WatchPartyParticipant {
  id: string;
  displayName: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface WatchParty {
  id: string;
  code: string;
  hostUserId: string;
  tmdbMovieId: number;
  currentPosition: number;
  isPlaying: boolean;
  isHost: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  participants: WatchPartyParticipant[];
}

export const watchPartyService = {
  async create(tmdbMovieId: number): Promise<WatchParty> {
    const { data } = await apiClient.post('/watch-parties', { tmdbMovieId });
    return data;
  },
  async get(code: string): Promise<WatchParty> {
    const { data } = await apiClient.get(`/watch-parties/${code}`);
    return data;
  },
  async join(code: string, displayName: string): Promise<{ participantId: string; party: WatchParty }> {
    const { data } = await apiClient.post(`/watch-parties/${code}/join`, { displayName });
    return data;
  },
  async updateState(code: string, currentPosition: number, isPlaying: boolean): Promise<WatchParty> {
    const { data } = await apiClient.put(`/watch-parties/${code}/state`, { currentPosition, isPlaying });
    return data;
  },
};
