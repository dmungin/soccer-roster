import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// Helper: build a full game object with lineups and positions
function getFullGame(gameId, userId) {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(gameId, userId);
  if (!game) return null;

  const lineups = db.prepare('SELECT * FROM lineups WHERE game_id = ? ORDER BY sort_order ASC').all(gameId);

  return {
    id: game.id,
    name: game.name,
    date: game.date || undefined,
    teamId: game.team_id,
    lineups: lineups.map(lineup => {
      const positions = db.prepare('SELECT * FROM lineup_positions WHERE lineup_id = ?').all(lineup.id);
      return {
        id: lineup.id,
        name: lineup.name,
        formationId: lineup.formation_id,
        positions: positions.map(p => ({
          id: p.id,
          label: p.label,
          x: p.x,
          y: p.y,
          playerId: p.player_id,
        })),
      };
    }),
  };
}

// GET /api/games — list user's games
router.get('/', (req, res) => {
  const games = db.prepare('SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

  const result = games.map(game => {
    const lineups = db.prepare('SELECT * FROM lineups WHERE game_id = ? ORDER BY sort_order ASC').all(game.id);
    return {
      id: game.id,
      name: game.name,
      date: game.date || undefined,
      teamId: game.team_id,
      lineups: lineups.map(lineup => {
        const positions = db.prepare('SELECT * FROM lineup_positions WHERE lineup_id = ?').all(lineup.id);
        return {
          id: lineup.id,
          name: lineup.name,
          formationId: lineup.formation_id,
          positions: positions.map(p => ({
            id: p.id,
            label: p.label,
            x: p.x,
            y: p.y,
            playerId: p.player_id,
          })),
        };
      }),
    };
  });

  res.json({ games: result });
});

// POST /api/games — create game
router.post('/', (req, res) => {
  const { name, teamId, date } = req.body;
  if (!name || !teamId) {
    return res.status(400).json({ error: 'name and teamId are required' });
  }

  // Verify team ownership
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(teamId, req.user.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO games (id, user_id, team_id, name, date) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, teamId, name, date || null);

  const game = getFullGame(id, req.user.id);
  res.status(201).json({ game });
});

// DELETE /api/games/:id — delete game
router.delete('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  db.prepare('DELETE FROM games WHERE id = ?').run(game.id);
  res.json({ ok: true });
});

// POST /api/games/:id/lineups — add lineup
router.post('/:id/lineups', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { name, formationId, positions } = req.body;
  if (!name || !formationId || !Array.isArray(positions)) {
    return res.status(400).json({ error: 'name, formationId, and positions are required' });
  }

  const lineupId = crypto.randomUUID();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM lineups WHERE game_id = ?').get(game.id);

  db.prepare('INSERT INTO lineups (id, game_id, name, formation_id, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(lineupId, game.id, name, formationId, maxOrder.max + 1);

  const insertPos = db.prepare('INSERT INTO lineup_positions (id, lineup_id, label, x, y, player_id) VALUES (?, ?, ?, ?, ?, ?)');
  const insertAllPositions = db.transaction((positionList) => {
    for (const pos of positionList) {
      insertPos.run(pos.id || crypto.randomUUID(), lineupId, pos.label, pos.x, pos.y, pos.playerId || null);
    }
  });
  insertAllPositions(positions);

  const updated = getFullGame(game.id, req.user.id);
  res.status(201).json({ game: updated });
});

// PUT /api/games/:id/lineups/:lineupId — update lineup (name, positions)
router.put('/:id/lineups/:lineupId', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const lineup = db.prepare('SELECT * FROM lineups WHERE id = ? AND game_id = ?').get(req.params.lineupId, game.id);
  if (!lineup) return res.status(404).json({ error: 'Lineup not found' });

  const { name, positions } = req.body;

  if (name !== undefined) {
    db.prepare('UPDATE lineups SET name = ? WHERE id = ?').run(name, lineup.id);
  }

  if (Array.isArray(positions)) {
    // Update each position
    const updatePos = db.prepare('UPDATE lineup_positions SET label = ?, x = ?, y = ?, player_id = ? WHERE id = ? AND lineup_id = ?');
    const updateAll = db.transaction((positionList) => {
      for (const pos of positionList) {
        updatePos.run(pos.label, pos.x, pos.y, pos.playerId || null, pos.id, lineup.id);
      }
    });
    updateAll(positions);
  }

  const updated = getFullGame(game.id, req.user.id);
  res.json({ game: updated });
});

// POST /api/games/:id/lineups/:lineupId/copy — duplicate lineup
router.post('/:id/lineups/:lineupId/copy', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const original = db.prepare('SELECT * FROM lineups WHERE id = ? AND game_id = ?').get(req.params.lineupId, game.id);
  if (!original) return res.status(404).json({ error: 'Lineup not found' });

  const newId = crypto.randomUUID();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM lineups WHERE game_id = ?').get(game.id);

  db.prepare('INSERT INTO lineups (id, game_id, name, formation_id, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(newId, game.id, original.name + ' (Copy)', original.formation_id, maxOrder.max + 1);

  const positions = db.prepare('SELECT * FROM lineup_positions WHERE lineup_id = ?').all(original.id);
  const insertPos = db.prepare('INSERT INTO lineup_positions (id, lineup_id, label, x, y, player_id) VALUES (?, ?, ?, ?, ?, ?)');

  const copyAll = db.transaction(() => {
    for (const pos of positions) {
      insertPos.run(crypto.randomUUID(), newId, pos.label, pos.x, pos.y, pos.player_id);
    }
  });
  copyAll();

  const updated = getFullGame(game.id, req.user.id);
  res.status(201).json({ game: updated });
});

// DELETE /api/games/:id/lineups/:lineupId — delete lineup
router.delete('/:id/lineups/:lineupId', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const lineup = db.prepare('SELECT * FROM lineups WHERE id = ? AND game_id = ?').get(req.params.lineupId, game.id);
  if (!lineup) return res.status(404).json({ error: 'Lineup not found' });

  db.prepare('DELETE FROM lineups WHERE id = ?').run(lineup.id);
  const updated = getFullGame(game.id, req.user.id);
  res.json({ game: updated });
});

export default router;
