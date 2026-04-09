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
  positions: LineupPosition[];
}

export interface Game {
  id: string;
  name: string;
  date?: string;
  teamId: string;
  lineups: Lineup[];
}
