import type { Lineup, Player } from '../types';

export interface ParsedLineupShift {
  period: number;
  shift: 'A' | 'B' | 'full';
  label: string;
}

/**
 * Parses a lineup's period and shift from explicit properties or by parsing its name (e.g. Q1A, Q2B, Quarter 1, H1A).
 */
export function parseLineupShift(lineup: Lineup): ParsedLineupShift {
  if (lineup.period != null && lineup.shift != null) {
    return {
      period: lineup.period,
      shift: lineup.shift,
      label: lineup.name || `Q${lineup.period}${lineup.shift === 'full' ? '' : lineup.shift}`,
    };
  }

  const name = (lineup.name || '').trim();

  // Pattern: Q1A, Q1-A, Q1 B, Q2, Quarter 1 A, etc.
  const quarterMatch = name.match(/^(?:Q|Quarter\s*)([1-4])(?:\s*[-_]?\s*([AB]))?$/i);
  if (quarterMatch) {
    const period = parseInt(quarterMatch[1], 10);
    const shift = (quarterMatch[2]?.toUpperCase() as 'A' | 'B') || 'full';
    return { period, shift, label: name };
  }

  // Pattern: H1A, Half 1 B, H2, etc.
  const halfMatch = name.match(/^(?:H|Half\s*)([1-2])(?:\s*[-_]?\s*([AB]))?$/i);
  if (halfMatch) {
    const period = parseInt(halfMatch[1], 10);
    const shift = (halfMatch[2]?.toUpperCase() as 'A' | 'B') || 'full';
    return { period, shift, label: name };
  }

  return {
    period: 1,
    shift: 'full',
    label: name || 'Lineup',
  };
}

export interface SubCallout {
  incomingPlayer: Player;
  positionLabel: string;
  replacedPlayer: Player | null;
}

export interface PositionShift {
  player: Player;
  fromPosition: string;
  toPosition: string;
}

export interface RestingPlayer {
  player: Player;
  fromPosition: string;
}

export interface SubstitutionDiff {
  incoming: SubCallout[];
  shifts: PositionShift[];
  resting: RestingPlayer[];
  staying: { player: Player; positionLabel: string }[];
}

/**
 * Calculates the difference between two consecutive lineups (e.g. Q1A -> Q1B).
 * Clearly determines:
 * 1. Who is coming in from the bench, at what position, and who they replace.
 * 2. Who is shifting positions on the field.
 * 3. Who is heading off the field to rest on the bench.
 */
export function calculateSubstitutionDiff(
  currentLineup: Lineup | undefined,
  nextLineup: Lineup | undefined,
  roster: Player[]
): SubstitutionDiff {
  const result: SubstitutionDiff = {
    incoming: [],
    shifts: [],
    resting: [],
    staying: [],
  };

  if (!nextLineup) return result;

  const playerMap = new Map<string, Player>(roster.map(p => [p.id, p]));

  // Build current lineup mappings
  const currentPosByPlayerId = new Map<string, string>();
  const currentPosById = new Map<string, { label: string; playerId: string | null }>();
  const currentPosByLabel = new Map<string, { label: string; playerId: string | null }>();

  if (currentLineup) {
    for (const pos of currentLineup.positions) {
      if (pos.playerId) {
        currentPosByPlayerId.set(pos.playerId, pos.label);
      }
      currentPosById.set(pos.id, { label: pos.label, playerId: pos.playerId });
      // If multiple positions share label, first one recorded
      if (!currentPosByLabel.has(pos.label)) {
        currentPosByLabel.set(pos.label, { label: pos.label, playerId: pos.playerId });
      }
    }
  }

  const nextPlayerIds = new Set<string>();

  // Compare next lineup positions
  for (const nextPos of nextLineup.positions) {
    if (!nextPos.playerId) continue;

    nextPlayerIds.add(nextPos.playerId);
    const nextPlayer = playerMap.get(nextPos.playerId) || { id: nextPos.playerId, name: 'Unknown Player' };
    const prevPositionLabel = currentPosByPlayerId.get(nextPos.playerId);

    if (!prevPositionLabel) {
      // Player was on the bench in currentLineup -> INCOMING SUB!
      // Find who was occupying this position in currentLineup
      const prevPosAtSameSlot = currentPosById.get(nextPos.id) || currentPosByLabel.get(nextPos.label);
      let replacedPlayer: Player | null = null;

      if (prevPosAtSameSlot && prevPosAtSameSlot.playerId && prevPosAtSameSlot.playerId !== nextPos.playerId) {
        replacedPlayer = playerMap.get(prevPosAtSameSlot.playerId) || {
          id: prevPosAtSameSlot.playerId,
          name: 'Teammate',
        };
      }

      result.incoming.push({
        incomingPlayer: nextPlayer,
        positionLabel: nextPos.label,
        replacedPlayer,
      });
    } else if (prevPositionLabel !== nextPos.label) {
      // Player was on the field, but moved positions -> SHIFT!
      result.shifts.push({
        player: nextPlayer,
        fromPosition: prevPositionLabel,
        toPosition: nextPos.label,
      });
    } else {
      // Player stayed at the same position
      result.staying.push({
        player: nextPlayer,
        positionLabel: nextPos.label,
      });
    }
  }

  // Find players who were on field in currentLineup but NOT on field in nextLineup -> RESTING!
  if (currentLineup) {
    for (const [playerId, positionLabel] of currentPosByPlayerId.entries()) {
      if (!nextPlayerIds.has(playerId)) {
        const player = playerMap.get(playerId) || { id: playerId, name: 'Unknown Player' };
        result.resting.push({
          player,
          fromPosition: positionLabel,
        });
      }
    }
  }

  return result;
}
