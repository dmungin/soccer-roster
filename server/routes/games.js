import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// Helper: build a full game object with lineups, positions, events, and live status
function getFullGame(gameId, userId) {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(gameId, userId);
  if (!game) return null;

  return formatGameRow(game);
}

function formatGameRow(game) {
  const lineups = db.prepare('SELECT * FROM lineups WHERE game_id = ? ORDER BY sort_order ASC').all(game.id);
  const events = db.prepare(`
    SELECT id, game_id, type, minute, period_index, shift, period_time_seconds, player_id, assist_player_id, notes, created_at
    FROM game_events
    WHERE game_id = ?
    ORDER BY minute ASC, created_at ASC
  `).all(game.id);

  let parsedConfig = undefined;
  if (game.game_config) {
    try {
      parsedConfig = JSON.parse(game.game_config);
    } catch {
      parsedConfig = undefined;
    }
  }

  return {
    id: game.id,
    name: game.name,
    date: game.date || undefined,
    teamId: game.team_id,
    status: game.status || 'scheduled',
    scoreUs: game.score_us ?? 0,
    scoreThem: game.score_them ?? 0,
    gameConfig: parsedConfig,
    events: events.map(e => ({
      id: e.id,
      gameId: e.game_id,
      type: e.type,
      minute: e.minute,
      periodIndex: e.period_index,
      shift: e.shift || undefined,
      periodTimeSeconds: e.period_time_seconds,
      playerId: e.player_id || undefined,
      assistPlayerId: e.assist_player_id || undefined,
      notes: e.notes || undefined,
      createdAt: e.created_at,
    })),
    lineups: lineups.map(lineup => {
      const positions = db.prepare('SELECT * FROM lineup_positions WHERE lineup_id = ?').all(lineup.id);
      return {
        id: lineup.id,
        name: lineup.name,
        formationId: lineup.formation_id,
        period: lineup.period != null ? lineup.period : undefined,
        shift: lineup.shift || undefined,
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
  res.json({ games: games.map(formatGameRow) });
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

  const { name, formationId, positions, period, shift } = req.body;
  if (!name || !formationId || !Array.isArray(positions)) {
    return res.status(400).json({ error: 'name, formationId, and positions are required' });
  }

  const lineupId = crypto.randomUUID();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM lineups WHERE game_id = ?').get(game.id);

  db.prepare('INSERT INTO lineups (id, game_id, name, formation_id, sort_order, period, shift) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(lineupId, game.id, name, formationId, maxOrder.max + 1, period || null, shift || null);

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

// PUT /api/games/:id/lineups/:lineupId — update lineup (name, positions, period, shift)
router.put('/:id/lineups/:lineupId', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const lineup = db.prepare('SELECT * FROM lineups WHERE id = ? AND game_id = ?').get(req.params.lineupId, game.id);
  if (!lineup) return res.status(404).json({ error: 'Lineup not found' });

  const { name, positions, period, shift } = req.body;

  const updates = [];
  const params = [];
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (period !== undefined) {
    updates.push('period = ?');
    params.push(period);
  }
  if (shift !== undefined) {
    updates.push('shift = ?');
    params.push(shift);
  }
  if (updates.length > 0) {
    params.push(lineup.id);
    db.prepare(`UPDATE lineups SET ${updates.join(', ')} WHERE id = ?`).run(...params);
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
// POST /api/games/:id/copy-from/:sourceGameId — copy all lineups from another game
router.post('/:id/copy-from/:sourceGameId', (req, res) => {
  const targetGame = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!targetGame) return res.status(404).json({ error: 'Target game not found' });

  const sourceGame = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.sourceGameId, req.user.id);
  if (!sourceGame) return res.status(404).json({ error: 'Source game not found' });

  const sourceLineups = db.prepare('SELECT * FROM lineups WHERE game_id = ? ORDER BY sort_order ASC').all(sourceGame.id);
  const insertLineup = db.prepare('INSERT INTO lineups (id, game_id, name, formation_id, sort_order) VALUES (?, ?, ?, ?, ?)');
  const insertPos = db.prepare('INSERT INTO lineup_positions (id, lineup_id, label, x, y, player_id) VALUES (?, ?, ?, ?, ?, ?)');

  const copyTransaction = db.transaction(() => {
    let maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM lineups WHERE game_id = ?').get(targetGame.id).max;

    for (const sLineup of sourceLineups) {
      const newLineupId = crypto.randomUUID();
      maxOrder += 1;
      insertLineup.run(newLineupId, targetGame.id, sLineup.name, sLineup.formation_id, maxOrder);

      const positions = db.prepare('SELECT * FROM lineup_positions WHERE lineup_id = ?').all(sLineup.id);
      for (const pos of positions) {
        insertPos.run(crypto.randomUUID(), newLineupId, pos.label, pos.x, pos.y, pos.player_id);
      }
    }
  });

  copyTransaction();

  const updated = getFullGame(targetGame.id, req.user.id);
  res.status(201).json({ game: updated });
});

// POST /api/games/:id/scaffold-lineups — batch add lineups (e.g. Q1A-Q4B)
router.post('/:id/scaffold-lineups', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { lineups } = req.body;
  if (!Array.isArray(lineups) || lineups.length === 0) {
    return res.status(400).json({ error: 'lineups array is required' });
  }

  let maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM lineups WHERE game_id = ?').get(game.id).max;

  const insertLineup = db.prepare('INSERT INTO lineups (id, game_id, name, formation_id, sort_order, period, shift) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPos = db.prepare('INSERT INTO lineup_positions (id, lineup_id, label, x, y, player_id) VALUES (?, ?, ?, ?, ?, ?)');

  const scaffoldTransaction = db.transaction(() => {
    for (const l of lineups) {
      const newLineupId = crypto.randomUUID();
      maxOrder += 1;
      insertLineup.run(newLineupId, game.id, l.name, l.formationId, maxOrder, l.period || null, l.shift || null);

      if (Array.isArray(l.positions)) {
        for (const pos of l.positions) {
          insertPos.run(pos.id || crypto.randomUUID(), newLineupId, pos.label, pos.x, pos.y, pos.playerId || null);
        }
      }
    }
  });

  scaffoldTransaction();

  const updated = getFullGame(game.id, req.user.id);
  res.status(201).json({ game: updated });
});

// PUT /api/games/:id/live-status — update live status, scores, config
router.put('/:id/live-status', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { status, scoreUs, scoreThem, gameConfig } = req.body;

  const updates = [];
  const params = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (scoreUs !== undefined) {
    updates.push('score_us = ?');
    params.push(scoreUs);
  }
  if (scoreThem !== undefined) {
    updates.push('score_them = ?');
    params.push(scoreThem);
  }
  if (gameConfig !== undefined) {
    updates.push('game_config = ?');
    params.push(typeof gameConfig === 'string' ? gameConfig : JSON.stringify(gameConfig));
  }

  if (updates.length > 0) {
    params.push(game.id);
    db.prepare(`UPDATE games SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = getFullGame(game.id, req.user.id);
  res.json({ game: updated });
});

// POST /api/games/:id/events — add event (goal, sub, period transition)
router.post('/:id/events', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { type, minute, periodIndex, shift, periodTimeSeconds, playerId, assistPlayerId, notes } = req.body;
  if (!type) return res.status(400).json({ error: 'Event type is required' });

  const eventId = crypto.randomUUID();

  const eventTransaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO game_events (id, game_id, type, minute, period_index, shift, period_time_seconds, player_id, assist_player_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      game.id,
      type,
      minute ?? 0,
      periodIndex ?? 1,
      shift || null,
      periodTimeSeconds ?? 0,
      playerId || null,
      assistPlayerId || null,
      notes || null
    );

    if (type === 'goal') {
      db.prepare("UPDATE games SET score_us = score_us + 1, status = CASE WHEN status = 'scheduled' THEN 'in_progress' ELSE status END WHERE id = ?").run(game.id);
    } else if (type === 'opponent_goal') {
      db.prepare("UPDATE games SET score_them = score_them + 1, status = CASE WHEN status = 'scheduled' THEN 'in_progress' ELSE status END WHERE id = ?").run(game.id);
    } else if (type === 'period_start') {
      db.prepare("UPDATE games SET status = 'in_progress' WHERE id = ? AND status = 'scheduled'").run(game.id);
    }
  });

  eventTransaction();

  const updated = getFullGame(game.id, req.user.id);
  res.status(201).json({ game: updated });
});

// DELETE /api/games/:id/events/:eventId — remove an event
router.delete('/:id/events/:eventId', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const event = db.prepare('SELECT * FROM game_events WHERE id = ? AND game_id = ?').get(req.params.eventId, game.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const deleteTransaction = db.transaction(() => {
    db.prepare('DELETE FROM game_events WHERE id = ?').run(event.id);
    if (event.type === 'goal') {
      db.prepare('UPDATE games SET score_us = MAX(0, score_us - 1) WHERE id = ?').run(game.id);
    } else if (event.type === 'opponent_goal') {
      db.prepare('UPDATE games SET score_them = MAX(0, score_them - 1) WHERE id = ?').run(game.id);
    }
  });

  deleteTransaction();

  const updated = getFullGame(game.id, req.user.id);
  res.json({ game: updated });
});

// POST /api/games/:id/complete — mark game completed
router.post('/:id/complete', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  db.prepare("UPDATE games SET status = 'completed' WHERE id = ?").run(game.id);
  const updated = getFullGame(game.id, req.user.id);
  res.json({ game: updated });
});

// POST /api/games/:id/reopen — reopen completed game
router.post('/:id/reopen', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  db.prepare("UPDATE games SET status = 'in_progress' WHERE id = ?").run(game.id);
  const updated = getFullGame(game.id, req.user.id);
  res.json({ game: updated });
});

export default router;
