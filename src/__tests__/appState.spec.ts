import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../stores/appState';
import { FORMATIONS } from '../utils/formations';
import { api } from '../services/api';
import type { Team, Game } from '../types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('creates teams and appends players', async () => {
    const mockTeam: Team = {
      id: 'team-1',
      name: 'Wyoming',
      color: 'bg-blue-600',
      icon: 'Shield',
      matchType: '11v11',
      defaultFormationId: '11v11-4-3-3',
      players: [],
    };

    vi.mocked(api.post).mockResolvedValueOnce({ team: mockTeam });

    const store = useAppStore();
    const team = await store.addTeam('Wyoming', 'bg-blue-600', 'Shield', '11v11', '11v11-4-3-3');
    expect(team.name).toBe('Wyoming');
    expect(store.teams.length).toBe(1);

    const teamWithPlayers: Team = {
      ...mockTeam,
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
    };
    vi.mocked(api.post).mockResolvedValueOnce({ team: teamWithPlayers });

    await store.appendPlayersToTeam(team.id, ['Alice', 'Bob']);
    expect(store.getTeam(team.id)?.players.length).toBe(2);
  });

  it('scaffolds game lineups and manages live game events', async () => {
    const mockGame: Game = {
      id: 'game-1',
      name: 'Milford vs Wyoming',
      teamId: 'team-1',
      status: 'scheduled',
      scoreUs: 0,
      scoreThem: 0,
      events: [],
      lineups: [],
    };

    vi.mocked(api.post).mockResolvedValueOnce({ game: mockGame });

    const store = useAppStore();
    const game = await store.addGame('Milford vs Wyoming', 'team-1', '2024-10-10');
    expect(store.games.length).toBe(1);

    const formation = FORMATIONS.find(f => f.id === '11v11-4-3-3')!;

    // Scaffold 8 shifts
    const gameWithScaffold: Game = {
      ...mockGame,
      lineups: [
        { id: 'l1', name: 'Q1A', period: 1, shift: 'A', formationId: formation.id, positions: [] },
        { id: 'l2', name: 'Q1B', period: 1, shift: 'B', formationId: formation.id, positions: [] },
      ],
    };
    vi.mocked(api.post).mockResolvedValueOnce({ game: gameWithScaffold });

    const scaffoldedGame = await store.scaffoldGameLineups(game.id, '8-shifts', formation);
    expect(scaffoldedGame.lineups.length).toBe(2);
    expect(scaffoldedGame.lineups[0].name).toBe('Q1A');

    // Add a goal event
    const gameWithGoal: Game = {
      ...gameWithScaffold,
      status: 'in_progress',
      scoreUs: 1,
      events: [
        {
          id: 'ev-1',
          gameId: game.id,
          type: 'goal',
          minute: 4,
          periodIndex: 1,
          shift: 'A',
          playerId: 'p1',
          assistPlayerId: 'p2',
        },
      ],
    };
    vi.mocked(api.post).mockResolvedValueOnce({ game: gameWithGoal });

    await store.addGameEvent(game.id, {
      type: 'goal',
      minute: 4,
      periodIndex: 1,
      shift: 'A',
      playerId: 'p1',
      assistPlayerId: 'p2',
    });

    expect(store.getGame(game.id)?.scoreUs).toBe(1);
    expect(store.getGame(game.id)?.events?.length).toBe(1);

    // Complete game
    const completedGame: Game = {
      ...gameWithGoal,
      status: 'completed',
    };
    vi.mocked(api.post).mockResolvedValueOnce({ game: completedGame });

    await store.completeGame(game.id);
    expect(store.getGame(game.id)?.status).toBe('completed');
  });
});
