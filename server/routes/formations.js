import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/formations — list custom formations
router.get('/', (req, res) => {
  const formations = db.prepare('SELECT * FROM custom_formations WHERE created_by = ? ORDER BY created_at DESC').all(req.user.id);
  
  const mapped = formations.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    positions: JSON.parse(f.positions),
    createdBy: f.created_by,
  }));
  
  res.json({ formations: mapped });
});

// POST /api/formations — create custom formation
router.post('/', (req, res) => {
  const { name, type, positions } = req.body;
  if (!name || !type || !Array.isArray(positions)) {
    return res.status(400).json({ error: 'name, type, and positions are required' });
  }

  // Validate number of positions
  const sizeMap = { '11v11': 11, '9v9': 9, '7v7': 7 };
  const expectedSize = sizeMap[type];
  
  if (!expectedSize || positions.length !== expectedSize) {
    return res.status(400).json({ error: `Invalid number of positions for ${type}. Expected ${expectedSize}.` });
  }

  // Check if formation name already exists to prevent duplicates for this user
  const existing = db.prepare('SELECT id FROM custom_formations WHERE LOWER(name) = LOWER(?) AND created_by = ?').get(name, req.user.id);
  if (existing) {
    return res.status(400).json({ error: `Formation with name "${name}" already exists.` });
  }

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO custom_formations (id, name, type, positions, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, type, JSON.stringify(positions), req.user.id);

  res.status(201).json({ formation: { id, name, type, positions, createdBy: req.user.id } });
});

// DELETE /api/formations/:id — delete a custom formation (owner only)
router.delete('/:id', (req, res) => {
  const formation = db.prepare('SELECT * FROM custom_formations WHERE id = ? AND created_by = ?').get(req.params.id, req.user.id);
  if (!formation) return res.status(404).json({ error: 'Formation not found' });
  db.prepare('DELETE FROM custom_formations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
