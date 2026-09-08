export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  icon: string;
  matchType: FormationType;
  defaultFormationId: string;
  quarterMinutes?: number;
  players: Player[];
}

export interface PositionDef {
  id: string;
  label: string; 
  x: number;     
  y: number;     
}

export type FormationType = '7v7' | '9v9' | '11v11';

export interface Formation {
  id: string;
  name: string;
  type: FormationType;
  positions: PositionDef[];
}

export interface LineupPosition extends PositionDef {
  playerId: string | null;
}

export interface Lineup {
  id: string;
  name: string;      
  formationId: string;
  period?: number;
  shift?: 'A' | 'B' | 'full';
  positions: LineupPosition[];
}

export type GameStatus = 'scheduled' | 'in_progress' | 'completed';

export interface GameConfig {
  periodDurationMinutes: number;
  hasMidPeriodSubs: boolean;
  subIntervalMinutes: number;
  totalPeriods: number;
  periodType: 'quarter' | 'half';
}

export interface GameEvent {
  id: string;
  gameId: string;
  type: 'goal' | 'opponent_goal' | 'period_start' | 'period_end' | 'sub';
  minute: number;
  periodIndex: number;
  shift?: string;
  periodTimeSeconds?: number;
  playerId?: string;
  assistPlayerId?: string;
  notes?: string;
  createdAt?: string;
}

export interface Game {
  id: string;
  name: string;
  date?: string;
  teamId: string;
  status?: GameStatus;
  scoreUs?: number;
  scoreThem?: number;
  gameConfig?: GameConfig;
  events?: GameEvent[];
  lineups: Lineup[];
}
