import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// Helper: get team with players
function getTeamWithPlayers(teamId, userId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(teamId, userId);
  if (!team) return null;

  const players = db.prepare('SELECT * FROM players WHERE team_id = ?').all(teamId);
  return {
    id: team.id,
    name: team.name,
    color: team.color,
    icon: team.icon,
    matchType: team.match_type,
    defaultFormationId: team.default_formation_id,
    players: players.map(p => ({ id: p.id, name: p.name })),
  };
}

// GET /api/teams — list user's teams with players
router.get('/', (req, res) => {
  const teams = db.prepare('SELECT * FROM teams WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

  const result = teams.map(team => {
    const players = db.prepare('SELECT * FROM players WHERE team_id = ?').all(team.id);
    return {
      id: team.id,
      name: team.name,
      color: team.color,
      icon: team.icon,
      matchType: team.match_type,
      defaultFormationId: team.default_formation_id,
      players: players.map(p => ({ id: p.id, name: p.name })),
    };
  });

  res.json({ teams: result });
});

// POST /api/teams — create team
router.post('/', (req, res) => {
  const { name, color, icon, matchType, defaultFormationId } = req.body;
  if (!name || !color || !icon || !matchType || !defaultFormationId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO teams (id, user_id, name, color, icon, match_type, default_formation_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, name, color, icon, matchType, defaultFormationId);

  const team = getTeamWithPlayers(id, req.user.id);
  res.status(201).json({ team });
});

// PUT /api/teams/:id — update team
router.put('/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const { name, color, icon } = req.body;
  if (name !== undefined) db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, team.id);
  if (color !== undefined) db.prepare('UPDATE teams SET color = ? WHERE id = ?').run(color, team.id);
  if (icon !== undefined) db.prepare('UPDATE teams SET icon = ? WHERE id = ?').run(icon, team.id);

  const updated = getTeamWithPlayers(team.id, req.user.id);
  res.json({ team: updated });
});

// DELETE /api/teams/:id — delete team (cascades to games)
router.delete('/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
  res.json({ ok: true });
});

// POST /api/teams/:id/players — bulk add players
router.post('/:id/players', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const { names } = req.body;
  if (!Array.isArray(names)) return res.status(400).json({ error: 'names must be an array' });

  const insert = db.prepare('INSERT INTO players (id, team_id, name) VALUES (?, ?, ?)');
  const insertMany = db.transaction((nameList) => {
    for (const name of nameList) {
      if (name.trim()) {
        insert.run(crypto.randomUUID(), team.id, name.trim());
      }
    }
  });

  insertMany(names);
  const updated = getTeamWithPlayers(team.id, req.user.id);
  res.json({ team: updated });
});

// DELETE /api/teams/:id/players/:playerId — remove player
router.delete('/:id/players/:playerId', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const player = db.prepare('SELECT * FROM players WHERE id = ? AND team_id = ?').get(req.params.playerId, team.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Remove player from all lineup positions in games for this team
  db.prepare(`
    UPDATE lineup_positions SET player_id = NULL
    WHERE player_id = ? AND lineup_id IN (
      SELECT l.id FROM lineups l
      JOIN games g ON l.game_id = g.id
      WHERE g.team_id = ?
    )
  `).run(player.id, team.id);

  db.prepare('DELETE FROM players WHERE id = ?').run(player.id);
  const updated = getTeamWithPlayers(team.id, req.user.id);
  res.json({ team: updated });
});

export default router;
