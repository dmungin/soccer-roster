import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../stores/appState';
import { FORMATIONS } from '../utils/formations';

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('creates teams and appends players', () => {
    const store = useAppStore();
    const team = store.addTeam('Wyoming');
    expect(team.name).toBe('Wyoming');
    expect(store.teams.length).toBe(1);

    store.appendPlayersToTeam(team.id, ['Alice', 'Bob']);
    expect(store.getTeam(team.id)?.players.length).toBe(2);
  });

  it('creates games with lineups', () => {
    const store = useAppStore();
    const team = store.addTeam('Milford');
    
    const game = store.addGame('Milford vs Wyoming', team.id, '2024-10-10');
    expect(store.games.length).toBe(1);
    expect(game.name).toBe('Milford vs Wyoming');

    const formation = FORMATIONS.find(f => f.id === '11v11-4-3-3')!;
    
    // Add lineup
    const lineup = store.addLineupToGame(game.id, 'Q1', formation);
    expect(game.lineups.length).toBe(1);
    expect(lineup?.positions.length).toBe(11);
    
    // Delete lineup
    store.deleteLineup(game.id, lineup!.id);
    expect(game.lineups.length).toBe(0);
  });
});
