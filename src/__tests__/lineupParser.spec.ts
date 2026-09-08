import { describe, it, expect } from 'vitest';
import { parseLineupShift, calculateSubstitutionDiff } from '../utils/lineupParser';
import type { Lineup, Player } from '../types';

describe('lineupParser', () => {
  describe('parseLineupShift', () => {
    it('parses Q1A, Q1B, Q2A, Q3, etc.', () => {
      expect(parseLineupShift({ id: '1', name: 'Q1A', formationId: 'f1', positions: [] })).toEqual({
        period: 1,
        shift: 'A',
        label: 'Q1A',
      });

      expect(parseLineupShift({ id: '2', name: 'Q2B', formationId: 'f1', positions: [] })).toEqual({
        period: 2,
        shift: 'B',
        label: 'Q2B',
      });

      expect(parseLineupShift({ id: '3', name: 'Quarter 3', formationId: 'f1', positions: [] })).toEqual({
        period: 3,
        shift: 'full',
        label: 'Quarter 3',
      });

      expect(parseLineupShift({ id: '4', name: 'H2A', formationId: 'f1', positions: [] })).toEqual({
        period: 2,
        shift: 'A',
        label: 'H2A',
      });
    });

    it('respects explicit period and shift fields if present', () => {
      expect(parseLineupShift({ id: '1', name: 'Opening Shift', formationId: 'f1', period: 1, shift: 'A', positions: [] })).toEqual({
        period: 1,
        shift: 'A',
        label: 'Opening Shift',
      });
    });
  });

  describe('calculateSubstitutionDiff', () => {
    const roster: Player[] = [
      { id: 'p1', name: 'Liam' },
      { id: 'p2', name: 'Maya' },
      { id: 'p3', name: 'Sophia' },
      { id: 'p4', name: 'Alex' },
      { id: 'p5', name: 'Noah' },
      { id: 'p6', name: 'Jackson' },
    ];

    it('accurately identifies incoming subs, position shifts, and resting players', () => {
      // Q1A: Liam at RW, Sophia at CM, Alex at ST. (Maya, Noah, Jackson on bench)
      const q1a: Lineup = {
        id: 'q1a',
        name: 'Q1A',
        formationId: 'f1',
        positions: [
          { id: 'pos-rw', label: 'RW', x: 20, y: 30, playerId: 'p1' }, // Liam
          { id: 'pos-cm', label: 'CM', x: 50, y: 50, playerId: 'p3' }, // Sophia
          { id: 'pos-st', label: 'ST', x: 50, y: 20, playerId: 'p4' }, // Alex
        ],
      };

      // Q1B: Maya at RW (replaces Liam), Liam at CM (shifts from RW), Jackson at ST (replaces Alex). Sophia & Alex to bench.
      const q1b: Lineup = {
        id: 'q1b',
        name: 'Q1B',
        formationId: 'f1',
        positions: [
          { id: 'pos-rw', label: 'RW', x: 20, y: 30, playerId: 'p2' }, // Maya (IN)
          { id: 'pos-cm', label: 'CM', x: 50, y: 50, playerId: 'p1' }, // Liam (SHIFT from RW)
          { id: 'pos-st', label: 'ST', x: 50, y: 20, playerId: 'p6' }, // Jackson (IN)
        ],
      };

      const diff = calculateSubstitutionDiff(q1a, q1b, roster);

      // Incoming: Maya at RW (replaces Liam), Jackson at ST (replaces Alex)
      expect(diff.incoming.length).toBe(2);
      expect(diff.incoming.find(i => i.incomingPlayer.id === 'p2')?.positionLabel).toBe('RW');
      expect(diff.incoming.find(i => i.incomingPlayer.id === 'p2')?.replacedPlayer?.name).toBe('Liam');
      expect(diff.incoming.find(i => i.incomingPlayer.id === 'p6')?.positionLabel).toBe('ST');
      expect(diff.incoming.find(i => i.incomingPlayer.id === 'p6')?.replacedPlayer?.name).toBe('Alex');

      // Shifts: Liam moved from RW to CM
      expect(diff.shifts.length).toBe(1);
      expect(diff.shifts[0].player.name).toBe('Liam');
      expect(diff.shifts[0].fromPosition).toBe('RW');
      expect(diff.shifts[0].toPosition).toBe('CM');

      // Resting: Sophia (was CM) and Alex (was ST)
      expect(diff.resting.length).toBe(2);
      expect(diff.resting.map(r => r.player.name).sort()).toEqual(['Alex', 'Sophia']);
    });
  });
});
