import type { Lineup } from '../types';

export function getPlayerPlayStats(playerId: string, lineups: Lineup[]) {
  if (lineups.length === 0) return { starts: 0, total: 0, percentage: 0 };
  
  let starts = 0;
  
  lineups.forEach(lineup => {
    // A player is active in this lineup if their ID exists in any position
    const isActive = lineup.positions.some(p => p.playerId === playerId);
    if (isActive) {
      starts++;
    }
  });

  return {
    starts,
    total: lineups.length,
    percentage: Math.round((starts / lineups.length) * 100),
  };
}
