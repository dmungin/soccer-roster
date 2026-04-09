import type { Formation, PositionDef } from '../types';

function createPositions(labelsDesc: { l: string, x: number, y: number }[]): PositionDef[] {
  return labelsDesc.map(pos => ({
    id: crypto.randomUUID(),
    label: pos.l,
    x: pos.x,
    y: pos.y - 6 // Systematically shift all positions up by 6% to prevent name card clipping
  }));
}

export const FORMATIONS: Formation[] = [
  // 7v7
  {
    id: '7v7-2-3-1',
    name: '2-3-1',
    type: '7v7',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LCB', x: 35, y: 75 },
      { l: 'RCB', x: 65, y: 75 },
      { l: 'LM', x: 25, y: 50 },
      { l: 'CM', x: 50, y: 50 },
      { l: 'RM', x: 75, y: 50 },
      { l: 'ST', x: 50, y: 20 },
    ])
  },
  {
    id: '7v7-3-2-1',
    name: '3-2-1',
    type: '7v7',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LB', x: 25, y: 75 },
      { l: 'CB', x: 50, y: 75 },
      { l: 'RB', x: 75, y: 75 },
      { l: 'LCM', x: 40, y: 50 },
      { l: 'RCM', x: 60, y: 50 },
      { l: 'ST', x: 50, y: 20 },
    ])
  },
  {
    id: '7v7-2-1-2-1',
    name: '2-1-2-1',
    type: '7v7',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LCB', x: 35, y: 80 },
      { l: 'RCB', x: 65, y: 80 },
      { l: 'CDM', x: 50, y: 60 },
      { l: 'LM', x: 30, y: 40 },
      { l: 'RM', x: 70, y: 40 },
      { l: 'ST', x: 50, y: 20 },
    ])
  },

  // 9v9
  {
    id: '9v9-3-2-3',
    name: '3-2-3',
    type: '9v9',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LB', x: 20, y: 80 },
      { l: 'CB', x: 50, y: 80 },
      { l: 'RB', x: 80, y: 80 },
      { l: 'LCM', x: 40, y: 55 },
      { l: 'RCM', x: 60, y: 55 },
      { l: 'LW', x: 20, y: 25 },
      { l: 'ST', x: 50, y: 25 },
      { l: 'RW', x: 80, y: 25 },
    ])
  },
  {
    id: '9v9-3-3-2',
    name: '3-3-2',
    type: '9v9',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LB', x: 20, y: 80 },
      { l: 'CB', x: 50, y: 80 },
      { l: 'RB', x: 80, y: 80 },
      { l: 'LM', x: 20, y: 50 },
      { l: 'CM', x: 50, y: 50 },
      { l: 'RM', x: 80, y: 50 },
      { l: 'LST', x: 40, y: 20 },
      { l: 'RST', x: 60, y: 20 },
    ])
  },
  {
    id: '9v9-4-3-1',
    name: '4-3-1',
    type: '9v9',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LB', x: 15, y: 80 },
      { l: 'LCB', x: 35, y: 80 },
      { l: 'RCB', x: 65, y: 80 },
      { l: 'RB', x: 85, y: 80 },
      { l: 'LCM', x: 30, y: 50 },
      { l: 'CM', x: 50, y: 50 },
      { l: 'RCM', x: 70, y: 50 },
      { l: 'ST', x: 50, y: 20 },
    ])
  },

  // 11v11
  {
    id: '11v11-4-3-3',
    name: '4-3-3',
    type: '11v11',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LB', x: 15, y: 80 },
      { l: 'LCB', x: 35, y: 80 },
      { l: 'RCB', x: 65, y: 80 },
      { l: 'RB', x: 85, y: 80 },
      { l: 'LCM', x: 35, y: 55 },
      { l: 'CDM', x: 50, y: 65 },
      { l: 'RCM', x: 65, y: 55 },
      { l: 'LW', x: 20, y: 25 },
      { l: 'ST', x: 50, y: 20 },
      { l: 'RW', x: 80, y: 25 },
    ])
  },
  {
    id: '11v11-4-4-2',
    name: '4-4-2',
    type: '11v11',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LB', x: 15, y: 80 },
      { l: 'LCB', x: 35, y: 80 },
      { l: 'RCB', x: 65, y: 80 },
      { l: 'RB', x: 85, y: 80 },
      { l: 'LM', x: 15, y: 50 },
      { l: 'LCM', x: 35, y: 50 },
      { l: 'RCM', x: 65, y: 50 },
      { l: 'RM', x: 85, y: 50 },
      { l: 'LST', x: 40, y: 25 },
      { l: 'RST', x: 60, y: 25 },
    ])
  },
  {
    id: '11v11-3-5-2',
    name: '3-5-2',
    type: '11v11',
    positions: createPositions([
      { l: 'GK', x: 50, y: 95 },
      { l: 'LCB', x: 25, y: 80 },
      { l: 'CB', x: 50, y: 80 },
      { l: 'RCB', x: 75, y: 80 },
      { l: 'LWB', x: 15, y: 55 },
      { l: 'LCM', x: 35, y: 50 },
      { l: 'CDM', x: 50, y: 60 },
      { l: 'RCM', x: 65, y: 50 },
      { l: 'RWB', x: 85, y: 55 },
      { l: 'LST', x: 40, y: 20 },
      { l: 'RST', x: 60, y: 20 },
    ])
  }
];
